require("dotenv").config();

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const Database = require("better-sqlite3");
const QRCode = require("qrcode");

const app = express();

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const SHARE_TTL_SECONDS = Number(process.env.SHARE_TTL_SECONDS || 300);
const MAX_SECRET_CHARS = Number(process.env.MAX_SECRET_CHARS || 10000);
const DATABASE_PATH = process.env.DATABASE_PATH || "./data/secure-share.sqlite";
const APP_SECRET_KEY = process.env.APP_SECRET_KEY || "";
const CODE_PEPPER = process.env.CODE_PEPPER || "";

const GENERIC_ERROR = "Koden er ugyldig eller udløbet.";

if (!APP_SECRET_KEY || !CODE_PEPPER) {
  console.error("APP_SECRET_KEY and CODE_PEPPER must be set.");
  process.exit(1);
}

const encryptionKey = parseAppSecretKey(APP_SECRET_KEY);
const dbPath = path.resolve(DATABASE_PATH);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
    CREATE TABLE IF NOT EXISTS shares (
      code_hash TEXT PRIMARY KEY,
      ciphertext BLOB NOT NULL,
      iv BLOB NOT NULL,
      auth_tag BLOB NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `);
db.exec("CREATE INDEX IF NOT EXISTS idx_shares_expires_at ON shares (expires_at)");

// Migration: add the content-type column to databases created before it existed.
const shareColumns = db.prepare("PRAGMA table_info(shares)").all();
if (!shareColumns.some((column) => column.name === "kind")) {
  db.exec("ALTER TABLE shares ADD COLUMN kind TEXT NOT NULL DEFAULT 'text'");
}

app.set("trust proxy", 1);

app.use(noStoreMiddleware);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'"],
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
      "base-uri": ["'none'"]
    }
  },
  referrerPolicy: { policy: "no-referrer" }
}));

app.use(express.json({ limit: "64kb" }));

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "For mange forespørgsler. Prøv igen om lidt." }
});

const receiveLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: GENERIC_ERROR }
});

app.use("/api", generalLimiter);
app.use(express.static(path.join(__dirname, "public"), {
  etag: false,
  lastModified: false,
  setHeaders: noStoreHeaders
}));

app.get("/healthz", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/qr", generalLimiter, async (req, res) => {
  try {
    const code = String(req.query?.code || "").trim();

    if (!/^\d{8}$/.test(code)) {
      return res.status(400).json({ error: "QR-koden kunne ikke genereres." });
    }

    const receiveUrl = `${req.protocol}://${req.get("host")}/?code=${encodeURIComponent(code)}`;
    const svg = await QRCode.toString(receiveUrl, {
      type: "svg",
      margin: 1,
      width: 256,
      color: {
        dark: "#080b10",
        light: "#ffffff"
      }
    });

    res.type("image/svg+xml").send(svg);
  } catch (error) {
    safeError(error);
    res.status(500).json({ error: "QR-koden kunne ikke genereres." });
  }
});

app.get("/api/status", generalLimiter, (req, res) => {
  try {
    const code = String(req.query?.code || "").trim();

    if (!/^\d{8}$/.test(code)) {
      return res.status(400).json({ error: GENERIC_ERROR });
    }

    const row = get("SELECT expires_at FROM shares WHERE code_hash = ?", [hashCode(code)]);
    const active = Boolean(row && Number(row.expires_at) > unixTime());

    res.json({ active });
  } catch (error) {
    safeError(error);
    res.status(500).json({ error: "Status kunne ikke hentes." });
  }
});

app.post("/api/send", async (req, res) => {
  try {
    const secret = req.body?.secret;
    const kind = normalizeKind(req.body?.kind);
    const ttlSeconds = normalizeTtl(req.body?.ttlSeconds);

    if (typeof secret !== "string" || secret.length === 0) {
      return res.status(400).json({ error: "Indholdet kunne ikke gemmes." });
    }

    if (Array.from(secret).length > MAX_SECRET_CHARS) {
      return res.status(413).json({ error: "Indholdet er for stort." });
    }

    const code = createUniqueCode();
    const codeHash = hashCode(code);
    const encrypted = encryptSecret(secret);
    const now = unixTime();
    const expiresAt = now + ttlSeconds;

    run(
      `INSERT INTO shares (code_hash, ciphertext, iv, auth_tag, kind, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [codeHash, encrypted.ciphertext, encrypted.iv, encrypted.authTag, kind, now, expiresAt]
    );

    res.json({ code, expiresInSeconds: ttlSeconds });
  } catch (error) {
    safeError(error);
    res.status(500).json({ error: "Indholdet kunne ikke gemmes." });
  }
});

app.post("/api/receive", receiveLimiter, async (req, res) => {
  try {
    const code = String(req.body?.code || "").trim();

    if (!/^\d{8}$/.test(code)) {
      return res.status(404).json({ error: GENERIC_ERROR });
    }

    const codeHash = hashCode(code);
    const now = unixTime();

    const receiveTransaction = db.transaction(() => {
      const row = get(
      "SELECT ciphertext, iv, auth_tag, kind, expires_at FROM shares WHERE code_hash = ?",
      [codeHash]
      );

      if (!row || Number(row.expires_at) <= now) {
        run("DELETE FROM shares WHERE code_hash = ?", [codeHash]);
        return null;
      }

      run("DELETE FROM shares WHERE code_hash = ?", [codeHash]);
      return row;
    });

    const row = receiveTransaction();

    if (!row) {
      return res.status(404).json({ error: GENERIC_ERROR });
    }

    const secret = decryptSecret(row);
    res.json({ secret, kind: row.kind === "password" ? "password" : "text" });
  } catch (error) {
    safeError(error);
    res.status(404).json({ error: GENERIC_ERROR });
  }
});

app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: "Indholdet er for stort." });
  }

  safeError(err);
  res.status(500).json({ error: "Der opstod en fejl." });
});

const cleanupTimer = setInterval(cleanupExpired, 60 * 1000);
cleanupTimer.unref();
cleanupExpired();

const server = app.listen(PORT, HOST, () => {
  console.log(`secure-share listening on ${HOST}:${PORT}`);
});

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

function shutdown() {
  clearInterval(cleanupTimer);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

function parseAppSecretKey(value) {
  const base64 = Buffer.from(value, "base64");
  if (base64.length === 32) return base64;

  const hex = Buffer.from(value, "hex");
  if (hex.length === 32) return hex;

  const utf8 = Buffer.from(value, "utf8");
  if (utf8.length >= 32) return crypto.createHash("sha256").update(utf8).digest();

  console.error("APP_SECRET_KEY must be at least 32 bytes, or base64/hex encoded 32 bytes.");
  process.exit(1);
}

function noStoreHeaders(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

function noStoreMiddleware(req, res, next) {
  noStoreHeaders(res);
  next();
}

function normalizeTtl(value) {
  const requested = Number(value);
  if ([60, 300, 600].includes(requested)) return requested;
  return SHARE_TTL_SECONDS;
}

function normalizeKind(value) {
  return value === "password" ? "password" : "text";
}

function unixTime() {
  return Math.floor(Date.now() / 1000);
}

function hashCode(code) {
  return crypto.createHmac("sha256", CODE_PEPPER).update(code).digest("hex");
}

function encryptSecret(secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { ciphertext, iv, authTag };
}

function decryptSecret(row) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey, row.iv);
  decipher.setAuthTag(row.auth_tag);
  return Buffer.concat([decipher.update(row.ciphertext), decipher.final()]).toString("utf8");
}

function createUniqueCode() {
  for (let i = 0; i < 8; i += 1) {
    const code = String(crypto.randomInt(10000000, 100000000));
    const existing = get("SELECT 1 FROM shares WHERE code_hash = ?", [hashCode(code)]);
    if (!existing) return code;
  }
  throw new Error("Could not allocate unique code");
}

function cleanupExpired() {
  try {
    run("DELETE FROM shares WHERE expires_at <= ?", [unixTime()]);
  } catch (error) {
    safeError(error);
  }
}

function run(sql, params = []) {
  return db.prepare(sql).run(params);
}

function get(sql, params = []) {
  return db.prepare(sql).get(params);
}

function safeError(error) {
  if (!error) return;
  console.error(error.message || "Internal error");
}
