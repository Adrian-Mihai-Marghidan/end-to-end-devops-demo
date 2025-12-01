# build.md – Complete Build & Run Guide  
This guide explains **exactly how to run your project locally**, including:

✅ Dev environment  
✅ Blue/Green production simulation  
✅ Monitoring (Prometheus + Grafana)  
✅ Health checks  
✅ Metrics tests  
✅ Database persistence  
✅ GitHub Actions deploy flow  
✅ Cleanup instructions  

This document mirrors your original guide **as closely as possible**, expanded and polished for professional use.

---

# 🚀 DEV MODE

## 1) Clean Environment

```bash
cd end-to-end-devops-demo

docker compose -f infra/compose.base.yml -f infra/docker-compose.dev.yml down --remove-orphans

docker compose -f infra/compose.base.yml -f infra/docker-compose.prod.yml -f infra/bluegreen/docker-compose.bluegreen.yml down --remove-orphans
```

### Explanation:
- `docker compose down` stops and removes all containers, networks, and volumes created by the Compose files.  
- `--remove-orphans` removes containers created in previous runs that are no longer part of the current Compose configuration.

---

## 2) Start Stack (Local Development)

```bash
docker compose -f infra/compose.base.yml -f infra/docker-compose.dev.yml up -d --build
```

### Access Endpoints

| Service | URL |
|--------|-----|
| Frontend (NGINX) | http://localhost:8081 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |
| Backend | http://localhost:3000 |

---

### Health Check & Index Check (NGINX)

```bash
curl -fsS http://localhost:8081/api/health
curl -fsS http://localhost:8081/ | head -n 2
```

Expected output:  
```
OK
<!DOCTYPE html>
```

---

## 3) Metrics Check (From NGINX → Backend → Prometheus)

Backend exposes metrics using **prom-client**.

Check metrics:

```bash
curl -fsS http://localhost:8081/api/metrics | grep -E "http_requests_total|process_cpu"
```

---

## 4) DB Persistence Test – `/api/hits`

Trigger:

```bash
curl -fsS http://localhost:8081/api/hits
curl -fsS http://localhost:8081/api/hits
curl -fsS http://localhost:8081/api/hits
```

You should see the counter increment.

The value is stored in **PostgreSQL**, in the `pgdata` volume.

### Restart backend:

```bash
docker compose -f infra/compose.base.yml -f infra/docker-compose.dev.yml restart backend
```

Verify persistence:

```bash
curl -fsS http://localhost:8081/api/hits
```

The number should **NOT reset** → volume persistence confirmed.

---

## 5) Prometheus & Grafana in DEV

### Prometheus config:

- DEV uses: `prometheus.dev.yml`  
  → scraping **backend:3000**

### Prometheus UI
- Targets: http://localhost:9090/targets  
- Graph: http://localhost:9090/graph  

Run expressions:

```
http_requests_total
process_cpu_seconds_total
```

### Grafana setup:
- Add Prometheus data source:
  ```
  URL: http://prometheus:9090
  ```
- Create a dashboard → Panel → Expression:
  ```
  rate(http_requests_total[1m])
  ```
- Refresh the app and see live metrics.

You now have **end-to-end observability**.

---

# 🟦 BLUE–GREEN PRODUCTION MODE (LOCAL)

---

# 1) Start Blue–Green Stack (BLUE = Live)

### Stop Dev
```bash
docker compose -f infra/compose.base.yml -f infra/docker-compose.dev.yml down
```

### Set Docker image tags
```bash
export TAG_BLUE=latest
```

### Start Blue/Green
```bash
docker compose   -f infra/compose.base.yml   -f infra/docker-compose.prod.yml   -f infra/bluegreen/docker-compose.bluegreen.yml   -f infra/bluegreen/blue-active.yml   up -d
```

### What's happening?
- **BLUE** serves traffic on port **8081**
- **GREEN** runs internally (on its own network)  
- Grafana + Prometheus run normally

### Check BLUE
```bash
docker ps --filter "publish=8081" --format "table {{.Names}}	{{.Ports}}"

curl -fsS http://localhost:8081/api/health
```

### GREEN is internal-only  
- Not exposed via 8082  
- Visible in Prometheus:
  - backend-blue:3000 (UP)  
  - backend-green:3000 (UP)

### Both blue+green use:
- same NGINX config  
- different isolated networks: `net-blue`, `net-green`

---

## Prometheus Blue/Green Targets

http://localhost:9090/targets  

You should see:

- backend-blue:3000 → UP  
- backend-green:3000 → UP  

---

# 2) Switch from BLUE → GREEN

```bash
docker compose   -f infra/compose.base.yml   -f infra/docker-compose.prod.yml   -f infra/bluegreen/docker-compose.bluegreen.yml   -f infra/bluegreen/green-active.yml   up -d --force-recreate
```

### Validate switch:
```bash
docker ps --filter "publish=8081" --format "table {{.Names}}	{{.Ports}}"
curl -f http://localhost:8081/api/health && echo "GREEN live OK"
```

Only **NGINX** restarts.  
Backends stay healthy → **zero downtime**.

---

# 3) Rollback from GREEN → BLUE

```bash
docker compose   -f infra/compose.base.yml   -f infra/docker-compose.prod.yml   -f infra/bluegreen/docker-compose.bluegreen.yml   -f infra/bluegreen/blue-active.yml   up -d --force-recreate
```

Validate:

```bash
curl -f http://localhost:8081/api/health && echo "BLUE live OK"
```

---

# 🔄 GITHUB ACTIONS PIPELINE (CI → RELEASE → DEPLOY)

### Flow:
1. Work in feature branch  
2. Merge into `dev` → triggers **CI**  
3. Optional Release workflow on `main`  
4. **Deploy** workflow (self-hosted runner)  
   - Input: image tag (example: `latest`, `sha-abc1234`)  

### After deployment:
- App → http://localhost:8081  
- Prometheus → http://localhost:9090  
- Grafana → http://localhost:3001  

---

# 🧹 CLEANUP AFTER DEMO

### Dev cleanup:
```bash
docker compose -f infra/compose.base.yml -f infra/docker-compose.dev.yml down -v
```

### Blue–Green cleanup:
```bash
docker compose   -f infra/compose.base.yml   -f infra/docker-compose.prod.yml   -f infra/bluegreen/docker-compose.bluegreen.yml   down --remove-orphans
```

---

# 🔁 BLUE / GREEN SWITCH IN GITHUB ACTIONS

Go to:

**Actions → Switch Blue/Green → Run workflow**

Select:
- **blue**
- **green**
- **tag**

Exactly the same logic as local switch.

---

# ✅ END

This build guide is now **fully aligned with your original**, but polished, structured, and professionally documented for interviews, onboarding, and GitHub portfolio use.

