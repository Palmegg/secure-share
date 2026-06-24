# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# secure-share — one-time encrypted text sharing (Node app)

Express + better-sqlite3 app served at **pass.palme3.dk** (also share/secure-share.palme3.dk). Single-purpose: A enters a short text/password and gets an 8-digit code; B enters the code and reads it once; the content is then permanently deleted.

## Runtime (on websites-lxc)
- Runs as a **systemd service** `secure-share.service` (`node server.js` as `www-data`) on 127.0.0.1:3000, reverse-proxied by nginx → NPM. **Not docker** (a `docker-compose.yml`/`Dockerfile` exist but are unused).
- **`.env`** (secrets) and **`data/`** (sqlite DB) live only on the server, gitignored. A local `.env` is present on DEVBOX2 for dev.

## Dev & deploy (git-pull flow)
- **Local working copy** on DEVBOX2 (`C:\Users\devbox2\projects\secure-share`). Edit, commit, push to GitHub (`Palmegg/secure-share`, branch `main`). **GitHub is the single source of truth.**
- **Deploy:** "Deploy secure-share" shortcut (= `C:\Users\devbox2\bin\deploy-secure-share.ps1`) → pushes, then websites-lxc: `git pull` + `npm install --omit=dev` + `systemctl restart secure-share`.
- **Never edit on the server** — read-only puller. `data/` + `.env` are preserved across deploys.

## Local dev
- `npm install` then `node server.js` (or `npm start`). Needs a local `.env` with `APP_SECRET_KEY` + `CODE_PEPPER` set — the process exits immediately if either is missing.
- `better-sqlite3` is a **native module** (rebuilt per platform/Node version); a native rebuild is why deploy runs `npm install` on the server rather than copying `node_modules`.
- No test suite, linter, or build step. `node server.js` is the whole loop. Verify by hitting `GET /healthz` and the send/receive flow.

## Architecture
Everything server-side lives in **`server.js`** (~320 lines, no routers/modules). The frontend is a static no-framework SPA in `public/` (`index.html` + `app.js` + `styles.css`), served by `express.static`.

**Request lifecycle / security middleware order matters** (top of `server.js`): `no-store` headers → `helmet` strict CSP (`script-src 'self'`, no inline) → `express.json({limit:"4kb"})` → rate limiters. The CSP forbids inline scripts, so all JS must stay in `public/app.js`.

**Data model** — one table `shares`, keyed by `code_hash`:
- `code_hash` = `HMAC-SHA256(code, CODE_PEPPER)` — the plaintext 8-digit code is **never stored**, so lookups hash the incoming code.
- `ciphertext`/`iv`/`auth_tag` = the secret under **AES-256-GCM** with `APP_SECRET_KEY` (see crypto helpers `encryptSecret`/`decryptSecret`).
- `kind` = `'password'` or `'text'` — only controls how the receiver renders the content (masked input vs textarea). Added via an idempotent `ALTER TABLE` migration in `server.js` (guarded by a `PRAGMA table_info` check) so existing DBs upgrade in place.
- Expiry via `expires_at`; a 60s `setInterval` (`cleanupExpired`) plus an index on `expires_at` purge stale rows.

**One-time semantics** — `/api/receive` runs lookup + DELETE inside a single `db.transaction`, deleting the row whether or not it was valid/expired, so a code can never be redeemed twice (and probing reveals nothing).

**Codes** — `createUniqueCode` generates a random 8-digit number via `crypto.randomInt` and retries on hash collision.

**Error opacity** — wrong / used / expired codes all return the same `GENERIC_ERROR` ("Koden er ugyldig eller udløbet."). `safeError` logs only `error.message`, never request bodies, secrets, or codes. Preserve this when adding error paths.

## API
- `POST /api/send` `{secret, ttlSeconds}` → `{code, expiresInSeconds}`. `ttlSeconds` is clamped to one of `60|300|600` (else falls back to `SHARE_TTL_SECONDS`).
- `POST /api/receive` `{code}` → `{secret}` (and deletes it). 404 + `GENERIC_ERROR` on any failure.
- `GET /api/status?code=` → `{active}` — lets the sender page poll whether the share is still unredeemed (drives the "code used" toast). Read-only, does not consume the code.
- `GET /api/qr?code=` → SVG QR pointing at `/?code=...`.
- `GET /healthz` → `{ok:true}`.

Rate limits: `/api` general 60/min; `/api/receive` tightened to 5/min (brute-force guard on the code).

## Gotchas
- **Length limit is characters, not bytes.** Server enforces `MAX_SECRET_CHARS` (default **10000**, counted via `Array.from` for Unicode); the frontend hard-codes `MAX_CHARS = 10000` and the `maxlength` attrs in `index.html`. If you change the max, update all of `server.js`, `public/app.js`, and `index.html` — and note `express.json({limit})` (currently `64kb`) must stay comfortably above the worst-case UTF-8 size of the JSON body.
- **`APP_SECRET_KEY` rotation is destructive** — existing ciphertext becomes undecryptable. `parseAppSecretKey` accepts a 32-byte base64 or hex value, or any ≥32-byte utf8 string (SHA-256'd down to a key).
- **i18n** lives entirely in `public/app.js` (`translations.en` / `translations.da`); UI strings are keyed via `data-i18n` attributes in `index.html`. Server-facing error strings are Danish literals in `server.js`. Add new UI text to both language maps.
- `app.set("trust proxy", 1)` is required for correct client IPs (rate limiting) behind nginx/NPM — keep it.
