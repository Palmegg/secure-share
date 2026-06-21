# Secure Share

Secure Share er en lille webapp til midlertidig deling af korte tekster/passwords via en 8-cifret engangskode.

Flowet er simpelt:

- A vælger **Send tekst**, indtaster indhold og får en engangskode.
- B vælger **Modtag tekst**, indtaster koden og ser indholdet.
- Indholdet slettes permanent fra serveren ved første succesfulde hentning.

## Sikkerhedsmodel

- Appen skal kun eksponeres via HTTPS, fx via Nginx Proxy Manager.
- Express kører med `app.set("trust proxy", 1)`.
- Secrets gemmes ikke i plaintext i SQLite.
- Secrets krypteres med AES-256-GCM.
- Engangskoder gemmes ikke i plaintext, men som HMAC-SHA256 med server-side pepper.
- Hver kode kan kun bruges én gang.
- Udløbne secrets slettes af cleanup-job og kan ikke hentes.
- API endpoints har rate limiting.
- Request body og secrets/codes logges ikke.
- Svar og statiske filer sendes med `Cache-Control: no-store`.

## Installation uden Docker

```bash
cd /var/www/apps/secure-share
npm install
cp .env.example .env
```

Generér secrets:

```bash
openssl rand -base64 32
openssl rand -hex 32
```

Udfyld `.env`:

```env
PORT=3000
HOST=127.0.0.1
NODE_ENV=production
SHARE_TTL_SECONDS=300
MAX_SECRET_BYTES=4096
APP_SECRET_KEY=<openssl rand -base64 32>
CODE_PEPPER=<openssl rand -hex 32>
DATABASE_PATH=./data/secure-share.sqlite
```

Start:

```bash
npm start
```

## Installation med Docker Compose

```bash
cp .env.example .env
docker compose up -d --build
```

Compose gemmer SQLite-data i:

```text
./data
```

## Nginx Proxy Manager

Hvis appen kører direkte på port `3000`:

```text
Domain Names: dit-domæne
Scheme: http
Forward Hostname / IP: IP-adressen på LXC eller Docker host
Forward Port: 3000
Websockets: off
```

SSL:

- Request new SSL certificate
- Force SSL enabled
- HTTP/2 enabled
- HSTS kun hvis du er sikker på HTTPS setup

Hvis appen kører bag lokal Nginx på Websites-LXC'en, kan NPM pege på:

```text
Scheme: http
Forward Hostname / IP: 10.10.20.27
Forward Port: 80
```

## Vigtige sikkerhedsnoter

- Brug altid HTTPS.
- Del engangskoden via en anden kanal end selve secret'en.
- Secrets er one-time-use.
- Secrets udløber automatisk.
- Appen er ikke egnet til langtidslagring af passwords.
- Mistet/udløbet/brugt kode kan ikke genskabes.
- Rotér `APP_SECRET_KEY` kun hvis du accepterer, at eksisterende shares ikke længere kan dekrypteres.

## API

### `POST /api/send`

```json
{
  "secret": "tekst eller password",
  "ttlSeconds": 300
}
```

Response:

```json
{
  "code": "48291357",
  "expiresInSeconds": 300
}
```

### `POST /api/receive`

```json
{
  "code": "48291357"
}
```

Success:

```json
{
  "secret": "tekst eller password"
}
```

Fejl:

```json
{
  "error": "Koden er ugyldig eller udløbet."
}
```

Samme fejl bruges for forkert, brugt og udløbet kode.
