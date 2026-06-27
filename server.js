require("dotenv").config();

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const Database = require("better-sqlite3");
const QRCode = require("qrcode");
const { WebSocketServer } = require("ws");

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

// ---------------------------------------------------------------------------
// Live session: end-to-end encrypted real-time relay.
//
// The server is a blind relay. It pairs two sockets by an 8-digit PIN and
// forwards opaque "signal" (ECDH public keys) and "msg" (ciphertext) frames
// between them. It never sees plaintext or key material and stores nothing on
// disk — all session state is in-memory and dies with the process.
// ---------------------------------------------------------------------------

const LIVE_WS_PATH = "/live-ws";
const LIVE_PENDING_TTL_MS = 2 * 60 * 1000; // join window before the PIN expires
const LIVE_IDLE_TTL_MS = 15 * 60 * 1000; // close after this long with no traffic
const LIVE_RECONNECT_GRACE_MS = 30 * 1000; // same-tab reconnect window
const LIVE_MAX_FRAME_BYTES = 96 * 1024; // raw ws frame cap (blind DoS guard)
const LIVE_MAX_SESSIONS = 500; // backstop against memory exhaustion
const LIVE_MSG_WINDOW_MS = 10 * 1000;
const LIVE_MSG_LIMIT = 30; // messages per window per connection
const LIVE_JOIN_WINDOW_MS = 60 * 1000;
const LIVE_JOIN_LIMIT_PER_IP = 5; // join attempts / minute / IP
const LIVE_GLOBAL_FAILED_JOIN_LIMIT = 100; // failed joins / minute, all IPs

const liveSessions = new Map(); // pin -> session
const liveTokens = new Map(); // reconnect token -> { pin, role }
const joinAttemptsByIp = new Map(); // ip -> [timestamps]
let globalFailedJoins = []; // timestamps of failed joins across all IPs

const wss = new WebSocketServer({ server, path: LIVE_WS_PATH, maxPayload: LIVE_MAX_FRAME_BYTES });

wss.on("connection", (ws, req) => {
  ws.isAlive = true;
  ws.live = { pin: null, role: null, msgTimes: [] };
  ws.on("pong", () => { ws.isAlive = true; });
  ws.on("message", (raw) => handleLiveMessage(ws, clientIp(req), raw));
  ws.on("close", () => handleLiveClose(ws));
  ws.on("error", () => {});
});

const liveHeartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    try { ws.ping(); } catch { /* ignore */ }
  });
  pruneJoinAttempts();
}, 30 * 1000);
liveHeartbeat.unref();

function handleLiveMessage(ws, ip, raw) {
  let msg;
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    return;
  }
  if (!msg || typeof msg.t !== "string") return;

  switch (msg.t) {
    case "create": return liveCreate(ws);
    case "join": return liveJoin(ws, ip, msg);
    case "signal": return liveRelay(ws, "signal", msg);
    case "msg": return liveRelay(ws, "msg", msg);
    case "typing": return liveTyping(ws, msg);
    case "resume": return liveResume(ws, msg);
    case "leave": return liveLeave(ws);
    default: return;
  }
}

function liveCreate(ws) {
  if (ws.live.pin) return; // already in a session on this socket
  if (liveSessions.size >= LIVE_MAX_SESSIONS) {
    return liveSend(ws, { t: "error", reason: "busy" });
  }

  const pin = mintLivePin();
  if (!pin) return liveSend(ws, { t: "error", reason: "busy" });

  const token = crypto.randomBytes(16).toString("hex");
  const session = {
    pin,
    state: "pending",
    host: { ws, token },
    guest: null,
    pendingTimer: null,
    idleTimer: null,
    graceTimers: { host: null, guest: null }
  };

  liveSessions.set(pin, session);
  liveTokens.set(token, { pin, role: "host" });
  ws.live = { pin, role: "host", msgTimes: [] };

  session.pendingTimer = setTimeout(() => {
    liveSend(session.host?.ws, { t: "session-expired", reason: "pending-timeout" });
    endLiveSession(session, "pending-timeout");
  }, LIVE_PENDING_TTL_MS);
  session.pendingTimer.unref();

  liveSend(ws, { t: "created", pin, token, role: "host" });
}

function liveJoin(ws, ip, msg) {
  if (ws.live.pin) return; // already paired on this socket
  const pin = String(msg.pin || "").trim();

  if (globalJoinLocked() || !allowJoinFromIp(ip)) {
    recordFailedJoin();
    return liveSend(ws, { t: "join-failed" });
  }
  if (!/^\d{8}$/.test(pin)) {
    recordFailedJoin();
    return liveSend(ws, { t: "join-failed" });
  }

  const session = liveSessions.get(pin);
  if (!session || session.state !== "pending" || session.guest) {
    recordFailedJoin();
    return liveSend(ws, { t: "join-failed" });
  }

  const token = crypto.randomBytes(16).toString("hex");
  session.guest = { ws, token };
  session.state = "active";
  liveTokens.set(token, { pin, role: "guest" });
  ws.live = { pin, role: "guest", msgTimes: [] };

  clearTimeout(session.pendingTimer);
  session.pendingTimer = null;
  resetIdleTimer(session);

  liveSend(ws, { t: "joined", token, role: "guest" });
  liveSend(session.host.ws, { t: "peer-joined" });
}

function liveRelay(ws, kind, msg) {
  const session = liveSessions.get(ws.live.pin);
  if (!session || session.state !== "active") return;
  if (typeof msg.data !== "string" || msg.data.length > LIVE_MAX_FRAME_BYTES) return;

  if (kind === "msg") {
    if (!withinMsgRate(ws)) return;
    resetIdleTimer(session);
  }

  const peer = peerOf(session, ws.live.role);
  liveSend(peer?.ws, { t: kind, data: msg.data });
}

function liveTyping(ws, msg) {
  // Tiny presence flag (carries no content); relayed to the peer only.
  const session = liveSessions.get(ws.live.pin);
  if (!session || session.state !== "active") return;
  liveSend(peerOf(session, ws.live.role)?.ws, { t: "typing", on: Boolean(msg.on) });
}

function liveResume(ws, msg) {
  const token = String(msg.token || "");
  const entry = liveTokens.get(token);
  if (!entry) return liveSend(ws, { t: "resume-failed" });

  const session = liveSessions.get(entry.pin);
  if (!session || session.state !== "active") return liveSend(ws, { t: "resume-failed" });

  const slot = entry.role === "host" ? session.host : session.guest;
  if (!slot) return liveSend(ws, { t: "resume-failed" });

  clearTimeout(session.graceTimers[entry.role]);
  session.graceTimers[entry.role] = null;
  slot.ws = ws;
  ws.live = { pin: entry.pin, role: entry.role, msgTimes: [] };

  liveSend(ws, { t: "resumed", role: entry.role });
  liveSend(peerOf(session, entry.role)?.ws, { t: "peer-reconnected" });
}

function liveLeave(ws) {
  const session = liveSessions.get(ws.live.pin);
  if (!session) return;
  liveSend(peerOf(session, ws.live.role)?.ws, { t: "peer-left" });
  endLiveSession(session, "left");
}

function handleLiveClose(ws) {
  const session = liveSessions.get(ws.live.pin);
  if (!session) return;
  const role = ws.live.role;

  if (session.state === "pending") {
    // Host vanished before anyone joined — nothing to preserve.
    endLiveSession(session, "host-gone");
    return;
  }

  const slot = role === "host" ? session.host : session.guest;
  if (!slot || slot.ws !== ws) return; // a stale socket that was already replaced

  // Active session: give the same tab a short window to reconnect.
  liveSend(peerOf(session, role)?.ws, { t: "peer-disconnected" });
  clearTimeout(session.graceTimers[role]);
  session.graceTimers[role] = setTimeout(() => {
    liveSend(peerOf(session, role)?.ws, { t: "peer-left" });
    endLiveSession(session, "grace-timeout");
  }, LIVE_RECONNECT_GRACE_MS);
  session.graceTimers[role].unref();
}

function endLiveSession(session, _reason) {
  clearTimeout(session.pendingTimer);
  clearTimeout(session.idleTimer);
  clearTimeout(session.graceTimers.host);
  clearTimeout(session.graceTimers.guest);
  liveSessions.delete(session.pin);

  for (const slot of [session.host, session.guest]) {
    if (!slot) continue;
    liveTokens.delete(slot.token);
    if (slot.ws && slot.ws.live) slot.ws.live = { pin: null, role: null, msgTimes: [] };
  }
}

function resetIdleTimer(session) {
  clearTimeout(session.idleTimer);
  session.idleTimer = setTimeout(() => {
    for (const slot of [session.host, session.guest]) {
      liveSend(slot?.ws, { t: "session-expired", reason: "idle" });
    }
    endLiveSession(session, "idle");
  }, LIVE_IDLE_TTL_MS);
  session.idleTimer.unref();
}

function peerOf(session, role) {
  return role === "host" ? session.guest : session.host;
}

function liveSend(ws, obj) {
  if (ws && ws.readyState === ws.OPEN) {
    try { ws.send(JSON.stringify(obj)); } catch { /* ignore */ }
  }
}

function mintLivePin() {
  for (let i = 0; i < 12; i += 1) {
    const pin = String(crypto.randomInt(10000000, 100000000));
    if (!liveSessions.has(pin)) return pin;
  }
  return null;
}

function withinMsgRate(ws) {
  const now = Date.now();
  ws.live.msgTimes = ws.live.msgTimes.filter((t) => now - t < LIVE_MSG_WINDOW_MS);
  ws.live.msgTimes.push(now);
  return ws.live.msgTimes.length <= LIVE_MSG_LIMIT;
}

function allowJoinFromIp(ip) {
  const now = Date.now();
  const arr = (joinAttemptsByIp.get(ip) || []).filter((t) => now - t < LIVE_JOIN_WINDOW_MS);
  arr.push(now);
  joinAttemptsByIp.set(ip, arr);
  return arr.length <= LIVE_JOIN_LIMIT_PER_IP;
}

function recordFailedJoin() {
  const now = Date.now();
  globalFailedJoins = globalFailedJoins.filter((t) => now - t < LIVE_JOIN_WINDOW_MS);
  globalFailedJoins.push(now);
}

function globalJoinLocked() {
  const now = Date.now();
  globalFailedJoins = globalFailedJoins.filter((t) => now - t < LIVE_JOIN_WINDOW_MS);
  return globalFailedJoins.length > LIVE_GLOBAL_FAILED_JOIN_LIMIT;
}

function pruneJoinAttempts() {
  const now = Date.now();
  for (const [ip, arr] of joinAttemptsByIp) {
    const kept = arr.filter((t) => now - t < LIVE_JOIN_WINDOW_MS);
    if (kept.length) joinAttemptsByIp.set(ip, kept);
    else joinAttemptsByIp.delete(ip);
  }
}

function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

function shutdown() {
  clearInterval(cleanupTimer);
  clearInterval(liveHeartbeat);
  wss.close();
  for (const ws of wss.clients) {
    try { ws.terminate(); } catch { /* ignore */ }
  }
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
