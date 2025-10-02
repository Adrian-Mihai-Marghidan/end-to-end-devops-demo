# End-to-End DevOps Demo

A tiny full-stack demo that shows a classic DevOps flow:

- **Frontend**: a static web page served by **NGINX**  
- **Backend**: a minimal **Node.js** HTTP service (no framework)  
- **Database**: **PostgreSQL** with a persistent volume  
- **Observability**: **Prometheus** scrapes backend metrics; **Grafana** visualizes them  
- **Orchestration (local)**: **Docker Compose**

---

## Repository Layout

```
end-to-end-devops-demo/
├─ backend/
│  ├─ test/
│  │  └─ handler.test.js          # simple unit test (node:test)
│  ├─ .dockerignore               # keeps node_modules etc. out of the image
│  ├─ Dockerfile                  # backend image definition
│  ├─ package-lock.json
│  ├─ package.json
│  └─ server.js                   # the HTTP server (health, metrics, hits)
│
├─ frontend/
│  └─ index.html                  # static page; calls /api/* through NGINX
│
├─ infra/
│  ├─ nginx/
│  │  └─ nginx.config             # serves frontend; proxies /api/* → backend:3000
│  ├─ prometheus/
│  │  └─ prometheus.yml           # scrape config (targets backend:3000/metrics)
│  └─ docker-compose.yml          # services: web, backend, db, prometheus, grafana
│
├─ .gitignore
└─ README.md
```

---

## Architecture (local)

```
Browser ──HTTP──> NGINX (web:8081)
  │                 ├─ serves /  → frontend/index.html
  └──────── /api/* ─┘           → proxy to backend:3000
                                  │
                                  ├─ /health   (5s delay, DB check)
                                  ├─ /metrics  (Prometheus text format)
                                  └─ /hits     (increments & returns counter in Postgres)
                                  
Prometheus (9090) ──scrape──> http://backend:3000/metrics
Grafana   (3001)  ──datasource──> Prometheus
Postgres  (5432)  <── persistent volume `infra_pgdata`
```

---

### Architecture diagram

![alt text](image.png)

---

## Prerequisites

- Docker Desktop (with **WSL integration** if on Windows)
- Docker Compose v2 (bundled with Docker Desktop)
- Optional (for local dev outside Compose): Node.js ≥ 20

---

## How to Run (Compose)

From the **infra** folder:

```bash
# 1) Start or rebuild everything
docker compose up -d --build

# 2) Tail logs (Ctrl+C to detach)
docker compose logs -f

# 3) Stop and remove containers/networks (volumes kept)
docker compose down
```

### Services & Ports

| Service       | Container name | Host Port → Container Port | Notes |
|---------------|-----------------|----------------------------|-------|
| NGINX (web)   | `web`           | **8081** → 80              | open http://localhost:8081 |
| Backend       | `backend`       | 3000 → 3000                | also reachable via NGINX `/api/*` |
| Postgres      | `db`            | 5432 → 5432                | DB: `appdb` / user: `appuser` / pass: `apppass` |
| Prometheus    | `prometheus`    | **9090** → 9090            | http://localhost:9090 |
| Grafana       | `grafana`       | **3001** → 3000            | http://localhost:3001 (admin / admin) |

> The backend is on the Compose network as `backend:3000`.  
> NGINX proxies `http://localhost:8081/api/*` → `http://backend:3000/*`.

---

## Quick Checks

```bash
# Frontend is served by NGINX
curl -s http://localhost:8081 | head -n1
# -> <!doctype html>

# Health (NGINX → backend; 5s delayed OK)
curl -s http://localhost:8081/api/health
# -> OK

# DB-backed counter (increments on each call)
curl -s http://localhost:8081/api/hits
# -> {"total":"<n>"}

# Metrics (Prometheus format)
curl -s http://localhost:8081/api/metrics
# -> # HELP app_requests_total ...
```

### Inspect Postgres

```bash
# Open psql in the DB container
docker compose exec db psql -U appuser -d appdb -c "SELECT * FROM hit_counter;"
```

---

## Backend Details

- **server.js**
  - `/health`: returns `OK` after ~5s **and** verifies DB is reachable.
  - `/metrics`: exposes `app_requests_total` (simple in-memory counter).
  - `/hits`: increases a persistent counter in Postgres (`hit_counter` table) and returns it as JSON.
- **Environment (read from `process.env`)**
  - `DB_HOST=db`, `DB_PORT=5432`, `DB_USER=appuser`, `DB_PASSWORD=apppass`, `DB_NAME=appdb`
  - These are set by Compose and used by the backend’s `pg` driver (`Pool`).
- **Dockerfile**
  - Multi-step-ish copy: installs only prod deps (`npm ci --omit=dev || npm install --omit=dev`), then copies the app and runs `node server.js`.
- **.dockerignore**
  - Avoids copying `node_modules`, `.git`, logs, and the Dockerfile itself into the build context.

### Run tests (backend)

From `backend/`:

```bash
# Unit (node:test)
npm run test:unit

# Smoke / integration (require running service)
npm run test:smoke     # checks /health
npm run test:metrics   # checks /metrics
```

---

## NGINX (reverse proxy)

- **Config**: `infra/nginx/nginx.config`
- Serves `frontend/index.html` at `/`
- Proxies `/api/` to `http://backend:3000/`
- This lets the browser call relative paths (`/api/health`, `/api/hits`, `/api/metrics`) **without** hard-coding host/port in the frontend.

---

## Prometheus & Grafana

- **Prometheus**
  - Config file: `infra/prometheus/prometheus.yml`
  - Scrapes `backend:3000/metrics` every 15s by default.
  - Persistent data: Docker volume `infra_prom_data`
  - UI: http://localhost:9090 (Graph → query `app_requests_total`)
- **Grafana**
  - UI: http://localhost:3001 (login: `admin` / `admin`)
  - Pre-provisioned Prometheus datasource pointing at `http://prometheus:9090`
  - Persistent data: Docker volume `infra_grafana_data`
  - Create a panel and query:
    - `app_requests_total` (instant value), or
    - `rate(app_requests_total[5m])` (per-second rate)

---

## Developing Without Docker (optional)

From `backend/`:

```bash
# Start backend directly
npm install
npm start
# -> Backend on :3000
```

You’d also need a local Postgres running and environment variables set accordingly. With Compose, all of that is pre-wired for you.

---

## Troubleshooting

- **`docker compose up` says “docker not found” in WSL**  
  Ensure **Docker Desktop → Settings → Resources → WSL Integration** is enabled for your Ubuntu distro.

- **NGINX fails: “directive not allowed here”**  
  Make sure you’re mounting `infra/nginx/nginx.config` into `/etc/nginx/conf.d/default.conf` (not `/etc/nginx/nginx.conf`).

- **Backend “ECONNREFUSED …:5432” on first boot**  
  Postgres might still be initializing. Compose’s `depends_on` is used, but DB may still need a moment. Recreate containers or try again.

- **I see `node_modules` in the repo**  
  Ensure `backend/.dockerignore` and the root `.gitignore` include `node_modules`, and remove it from Git history if accidentally committed.

---

## License

MIT © Adrian-Mihai Marghidan
- CI test Thu Oct  2 08:34:24 EEST 2025
- Test Branch Policy
