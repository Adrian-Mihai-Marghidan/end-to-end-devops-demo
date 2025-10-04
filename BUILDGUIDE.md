# End-to-End DevOps Demo – Build Guide

This guide explains how to **build, test, release, and deploy** the project locally and via GitHub Actions, including **observability** and **blue/green** deployment.

---

## 1) Project Overview

**Stack**
- **Frontend**: static site served by **NGINX**  
- **Backend**: Node.js (no framework) + PostgreSQL driver; exposes `/health`, `/hits`, `/metrics`  
- **Database**: PostgreSQL with a **persistent volume**  
- **Observability**: Prometheus scrapes `/metrics`; Grafana dashboards  
- **Orchestration**: Docker Compose  
- **CI**: `.github/workflows/ci.yml`  
- **Release**: `.github/workflows/release.yml`  
- **Deploy**: `.github/workflows/deploy.yml`  
- **Blue/Green**: optional overlay files for safe cutovers

---

## 2) Prerequisites

- Docker + Docker Compose v2
- curl, grep
- GitHub repo with Actions enabled
- GHCR credentials (PAT with read/write:packages)
- Self-hosted runner (for Deploy workflow)

---

## 3) Run Locally (Dev)

```bash
docker compose -f infra/compose.base.yml -f infra/docker-compose.dev.yml up -d --build
```

Verify:
```bash
curl -fsS http://localhost:8081/api/health
curl -fsS http://localhost:8081/
curl -fsS http://localhost:8081/api/metrics | head
```

Stop:
```bash
docker compose -f infra/compose.base.yml -f infra/docker-compose.dev.yml down -v
```

---

## 4) Smoke Tests

```bash
chmod +x scripts/smoke.sh
./scripts/smoke.sh
```

Checks health, index.html, and metrics.

---

## 5) CI Workflow

Triggered on:
- `pull_request` to main
- `push` on main, dev, feature/**

Runs docker compose, smoke tests, and teardown.

---

## 6) Release Workflow

Triggered on push to main. Builds and pushes:

- `ghcr.io/<owner>/<repo>/backend:{sha,latest}`
- `ghcr.io/<owner>/<repo>/web:{sha,latest}`

---

## 7) Deploy Workflow

Manual trigger from Actions tab.

Steps:
- Login to GHCR
- docker compose pull + up
- Health check

Optional: stop old stack before pulling.

---

## 8) Demonstrating DB Persistence

```bash
curl -fsS http://localhost:8081/api/hits
docker compose down
docker compose up -d
curl -fsS http://localhost:8081/api/hits   # continues from last value
```

---

## 9) Observability

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (login: admin/admin)
- Add Prometheus datasource: http://prometheus:9090

---

## 10) Blue/Green Deployment

Bring up both colors:

```bash
TAG_BLUE=latest TAG_GREEN=latest \
docker compose -f infra/compose.base.yml -f infra/docker-compose.prod.yml -f infra/bluegreen/docker-compose.bluegreen.yml up -d
```

Check health:
```bash
curl http://localhost:8081/api/health   # blue
curl http://localhost:8082/api/health   # green
```

Flip active color:
```bash
# Blue active
docker compose ... -f infra/bluegreen/blue-active.yml up -d

# Green active
docker compose ... -f infra/bluegreen/green-active.yml up -d
```

---

## 11) Branch Protection

- Require PRs to merge into main
- Require status check `build-and-test`
- Require review (optional)

---
