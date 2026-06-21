# secure-share — one-time encrypted text sharing (Node app)

Express + better-sqlite3 app served at **pass.palme3.dk** (also share/secure-share.palme3.dk).

## Runtime (on websites-lxc)
- Runs as a **systemd service** `secure-share.service` (`node server.js` as `www-data`) on 127.0.0.1:3000, reverse-proxied by nginx → NPM. **Not docker** (a `docker-compose.yml` exists but is unused).
- **`.env`** (secrets) and **`data/`** (sqlite DB) live only on the server, gitignored. A local `.env` is present on DEVBOX2 for dev.

## Dev & deploy (git-pull flow)
- **Local working copy** on DEVBOX2 (`C:\Users\devbox2\projects\secure-share`). Edit, commit, push to GitHub (`Palmegg/secure-share`, branch `main`). **GitHub is the single source of truth.**
- **Deploy:** "Deploy secure-share" shortcut (= `C:\Users\devbox2\bin\deploy-secure-share.ps1`) → pushes, then websites-lxc: `git pull` + `npm install --omit=dev` + `systemctl restart secure-share`.
- **Never edit on the server** — read-only puller. `data/` + `.env` are preserved across deploys.

## Local dev
- `npm install` then `node server.js` (needs the local `.env`). `better-sqlite3` is a native module.
