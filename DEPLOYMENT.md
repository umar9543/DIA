# DIA — Backend Deployment Guide (Docker)

This guide takes the DIA backend from your laptop to a production server in three parts:

- **Part A** — run the whole stack locally with Docker Desktop (10 minutes)
- **Part B** — deploy to a Linux server in Germany with automatic HTTPS (about an hour the first time)
- **Part C** — day-2 operations: updates, logs, backups, rollback, troubleshooting

Everything is driven by files that already exist in the repo:

| File | What it does |
|---|---|
| `backend/Dockerfile` | Builds the API image (Node 22 Alpine, non-root, health check) |
| `backend/.dockerignore` | Keeps `node_modules`, `.env`, logs out of the image |
| `docker-compose.yml` | Base stack: SQL Server 2022 (`db`), one-shot DB creator (`db-init`), API (`api`) |
| `docker-compose.prod.yml` | Production overlay: removes the API's public port, adds Caddy for HTTPS + serves the frontend |
| `Caddyfile` | Caddy config: `API_DOMAIN` → API, `APP_DOMAIN` → React build |
| `.env.example` | Template for the secrets/ports compose reads from `.env` |

The API image contains **no data**: users, sheet/column names and dashboard layouts live in SQL Server; spreadsheet rows never reach the server at all (they stay in the user's browser).

---

## Part A — Run locally with Docker Desktop

### A1. Prerequisites
- Docker Desktop installed and **running** (whale icon in the tray, `docker info` works).
- At least **5 GB free disk space** on the drive Docker Desktop uses (normally `C:`). The SQL Server image alone is ~1.5 GB. *If the drive is full, image pulls fail with `input/output error` — free space first (Docker Desktop → Troubleshoot → Clean / Purge data, or move the disk image under Settings → Resources → Advanced).*
- Stop any backend you are running with `npm run dev` on port 5000, or use a different `API_PORT` below.

### A2. Create the environment file
In the repo root (`E:\React\DIA`):

```bash
cp .env.example .env
```

Open `.env` and set:

```
DB_PASSWORD=<8+ chars with upper, lower, digit, symbol>   # SQL Server refuses weak passwords
DB_NAME=dia_db
JWT_SECRET=<long random string>
API_PORT=5000
```

Generate a proper JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`.env` is git-ignored. Never commit it.

### A3. Build and start

```bash
docker compose up -d --build
```

What happens, in order:
1. `db` starts SQL Server 2022 Express with a persistent volume `dia-mssql-data`.
2. `db-init` waits until SQL Server answers `SELECT 1`, then runs `CREATE DATABASE dia_db` if it doesn't exist, and exits.
3. `api` builds from `backend/Dockerfile`, starts after `db-init` succeeded, and creates the `users` / `schemas` tables on first boot.

First run takes a few minutes (image download + SQL Server start). Later runs take seconds.

### A4. Verify

```bash
docker compose ps
```

You want `dia-db` **healthy**, `dia-api` **running (healthy)**, `db-init` **exited (0)**.

```bash
curl http://localhost:5000/health
```

Expected: `{"status":"ok","message":"DIA Backend is running"}`

Register a user through the API to prove the DB connection works end-to-end:

```bash
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"you@example.com\",\"password\":\"Test1234!\"}"
```

Expected: a JSON body with a `token`.

### A5. Point the frontend at it
Create `frontend/dia/.env`:

```
VITE_API_URL=http://localhost:5000
```

then `npm run dev` in `frontend/dia` as usual.

### A6. Everyday commands

```bash
docker compose logs -f api        # follow API logs
docker compose restart api        # restart just the API
docker compose down               # stop everything (data volume is kept)
docker compose down -v            # stop AND delete the database volume (fresh start)
docker compose up -d --build      # rebuild after code changes
```

Optional: to open the DB in SSMS / Azure Data Studio, uncomment the `ports: "1433:1433"` lines under `db` in `docker-compose.yml`, run `docker compose up -d`, and connect to `localhost,1433` as `sa`.

---

## Part B — Production on a German server with HTTPS

Target: `https://api.yourdomain.de` (API) and `https://app.yourdomain.de` (React app), both on one VPS, TLS certificates managed automatically by Caddy.

### B1. Get a server and DNS
1. Rent a Linux VPS in a German data centre — Hetzner Cloud (Falkenstein / Nuremberg), IONOS, or netcup. **Ubuntu 24.04**, at least **2 vCPU / 4 GB RAM / 40 GB disk** (SQL Server wants ~2 GB RAM on its own).
2. In your DNS provider, create two **A records** pointing at the server's public IPv4 (and AAAA if it has IPv6):
   - `api.yourdomain.de`
   - `app.yourdomain.de`

   Caddy can only obtain certificates once these resolve to the server, so do this first.
3. In the hosting firewall (Hetzner "Firewalls" / security group) allow inbound **22, 80, 443** only.

### B2. Prepare the server
SSH in as root (or a sudo user) and run:

```bash
apt update && apt upgrade -y
```

```bash
curl -fsSL https://get.docker.com | sh
```

```bash
apt install -y git ufw
```

```bash
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
```

Optional but recommended: create a non-root user for deployments and add it to the `docker` group (`usermod -aG docker <user>`).

### B3. Get the code onto the server
Either clone from your Git host:

```bash
git clone https://github.com/<you>/DIA.git /opt/dia && cd /opt/dia
```

or copy only what the backend needs (`backend/`, `docker-compose.yml`, `docker-compose.prod.yml`, `Caddyfile`, `.env.example`) with `scp`/`rsync`.

> The repo currently has `backend/node_modules` committed. It is harmless for Docker (the `.dockerignore` excludes it) but makes the clone slow; removing it from git (`git rm -r --cached backend/node_modules`) is a good clean-up before your first production deploy.

### B4. Create the production `.env`

```bash
cp .env.example .env && nano .env
```

Set **all** of these:

```
DB_PASSWORD=<strong, unique>
DB_NAME=dia_db
JWT_SECRET=<64+ random hex chars — different from local!>
API_DOMAIN=api.yourdomain.de
APP_DOMAIN=app.yourdomain.de
FRONTEND_ORIGIN=https://app.yourdomain.de
```

`FRONTEND_ORIGIN` locks CORS so only your app's origin can call the API. `API_PORT` is ignored in production because the overlay removes the API's public port — everything goes through Caddy.

### B5. Build the frontend for production
Caddy serves the static React build from `frontend/dia/dist`. Build it **with the production API URL** — either on the server (needs Node) or on your PC and upload the `dist` folder:

On your PC:

```bash
cd frontend/dia && echo VITE_API_URL=https://api.yourdomain.de > .env.production && npm run build
```

then upload:

```bash
rsync -avz --delete frontend/dia/dist/ root@<server-ip>:/opt/dia/frontend/dia/dist/
```

(If you build on the server instead, install Node 22 there and run the same `npm ci && npm run build` inside `frontend/dia`.)

### B6. Start the production stack

```bash
cd /opt/dia
```

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Caddy will request Let's Encrypt certificates for both domains on first start (takes ~30 s once DNS is live).

### B7. Verify

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

```bash
curl https://api.yourdomain.de/health
```

Open `https://app.yourdomain.de` in a browser: you should see the landing page with a valid padlock, and be able to register / sign in / load an Excel file.

Also confirm the API is **not** reachable directly (only via Caddy):

```bash
curl -m 3 http://<server-ip>:5000/health || echo "correct: not exposed"
```

### B8. Make it survive reboots
All services have `restart: unless-stopped`, and Docker itself is enabled as a systemd service by the install script — so a reboot brings everything back. Verify once with `reboot` and re-run B7.

---

## Part C — Operations

### C1. Deploying an update
```bash
cd /opt/dia && git pull
```
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
Only the `api` image is rebuilt; SQL Server data and certificates are untouched. Re-upload `frontend/dia/dist` when the frontend changed (Caddy serves it live, no restart needed).

### C2. Logs and health
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api
```
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f caddy
```
```bash
docker inspect --format '{{.State.Health.Status}}' dia-api
```

### C3. Backups
Only metadata lives in the database (users, password hashes, sheet/column names). Back it up daily with a native SQL Server backup into the volume, then copy it off-server:

```bash
docker exec dia-db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$DB_PASSWORD" -C -Q "BACKUP DATABASE [dia_db] TO DISK='/var/opt/mssql/dia_db.bak' WITH INIT"
```
```bash
docker cp dia-db:/var/opt/mssql/dia_db.bak ./backups/dia_db-$(date +%F).bak
```

Put both lines in a cron job (`crontab -e`, e.g. `0 3 * * *`) and sync `./backups` to object storage in the EU (Hetzner Object Storage, IONOS S3).

Restore: `docker cp` the `.bak` back in and run `RESTORE DATABASE [dia_db] FROM DISK='/var/opt/mssql/dia_db.bak' WITH REPLACE`.

### C4. Rollback
Images are tagged by content; to go back to the previous code, `git checkout <previous-commit>` and run the same `up -d --build`. Database schema changes are additive (`IF NOT EXISTS`), so old code runs against a newer DB.

### C5. Using a managed / existing SQL Server instead
Delete the `db` and `db-init` services (and the `depends_on` under `api`) from `docker-compose.yml`, then set in `.env`:

```
DB_SERVER=<host>
DB_USER=<user>
DB_PASSWORD=<pw>
DB_ENCRYPT=true
DB_TRUST_CERT=false
```

and pass them through in the `api` service's `environment` block. The image itself does not change.

### C6. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `input/output error` while pulling images (Windows) | Docker Desktop's disk is full or its VM disk is corrupted. Free space on `C:`, then Docker Desktop → Troubleshoot → *Clean / Purge data*, restart Docker Desktop, run `up` again. |
| `dia-db` never becomes healthy | `DB_PASSWORD` too weak (SQL Server enforces complexity) or <2 GB RAM available. `docker compose logs db`. |
| `api` restarts in a loop, log says `Database connection failed` | Wrong `DB_PASSWORD`/`DB_NAME`, or started before `db-init` finished — `docker compose up -d` again. |
| Caddy log: `obtaining certificate ... failed` | DNS not pointing at the server yet, or port 80/443 blocked by the provider firewall. |
| Browser: CORS error | `FRONTEND_ORIGIN` doesn't match the exact origin (scheme + host, no trailing slash) the app is served from. |
| App loads but API calls go to `localhost:5000` | Frontend was built without `VITE_API_URL`; rebuild (B5). |

### C7. Before real customers (checklist)
- [ ] `JWT_SECRET` and `DB_PASSWORD` unique per environment, stored only in the server's `.env`
- [ ] Off-server backup of the DB verified by a test restore
- [ ] Rate limiting on `/api/auth/*` (e.g. `express-rate-limit`) and `helmet` headers on the API
- [ ] Impressum, Datenschutzerklärung and AVV linked from the app
- [ ] Self-hosted fonts/icons instead of Google Fonts / cdnjs (GDPR)
- [ ] Monitoring/uptime check on `https://api.yourdomain.de/health`
