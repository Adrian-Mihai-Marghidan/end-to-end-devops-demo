# End-to-End DevOps Demo

This repository demonstrates a complete CI/CD and observability pipeline with Docker, GitHub Actions, Prometheus, and Grafana.

---

## 📌 Architecture

![Architecture Diagram](image.png)

### Components:
- **Frontend (NGINX)**: Serves static `index.html` and proxies API requests to the backend.
- **Backend (Node.js)**: Simple Node.js service with PostgreSQL persistence and Prometheus metrics endpoint.
- **Database (PostgreSQL)**: Persists data across container restarts.
- **Prometheus**: Scrapes backend metrics (`/metrics` endpoint).
- **Grafana**: Visualizes metrics via dashboards.
- **NGINX**: Runs on port **8081**, proxies `/api/*` requests to backend on port **3000**.

---

## 🚀 Workflows

- **CI Workflow** (`ci.yml`)
  - Runs tests and smoke checks on pull requests and feature branches.
- **Release Workflow** (`release.yml`)
  - Builds and pushes Docker images (`backend` and `web`) to GHCR.
- **Deploy Workflow** (`deploy.yml`)
  - Deploys images on a **self-hosted runner** with manual approval for production.

---

## 🛠️ Running Locally

Start the development environment:

```bash
docker compose -f infra/compose.base.yml -f infra/docker-compose.dev.yml up -d --build
```

Then visit:
- Frontend: [http://localhost:8081](http://localhost:8081)
- Backend health: [http://localhost:3000/health](http://localhost:3000/health)
- Backend metrics: [http://localhost:3000/metrics](http://localhost:3000/metrics)
- Prometheus: [http://localhost:9090](http://localhost:9090)
- Grafana: [http://localhost:3001](http://localhost:3001)

---

## 📊 Observability

- Prometheus scrapes metrics from backend every **15s** (`infra/prometheus/prometheus.yml`).
- Grafana connects to Prometheus as a datasource for dashboards.

---

## 🔄 Blue-Green Deployment

Blue-green strategy is defined in `infra/bluegreen/`:

- `docker-compose.bluegreen.yml`: Defines **blue** and **green** stacks.
- `blue-active.yml` and `green-active.yml`: Flip which stack serves traffic on **8081**.

Demo sequence:

```bash
# Start both colors
docker compose -f infra/compose.base.yml -f infra/docker-compose.prod.yml -f infra/bluegreen/docker-compose.bluegreen.yml up -d

# Test endpoints
curl -fsS http://localhost:8081/api/health   # Blue
curl -fsS http://localhost:8082/api/health   # Green

# Switch to Blue
docker compose -f infra/compose.base.yml -f infra/docker-compose.prod.yml -f infra/bluegreen/docker-compose.bluegreen.yml -f infra/bluegreen/blue-active.yml up -d

# Flip to Green
docker compose -f infra/compose.base.yml -f infra/docker-compose.prod.yml -f infra/bluegreen/docker-compose.bluegreen.yml -f infra/bluegreen/green-active.yml up -d
```

---

## ✅ Smoke Tests

Smoke tests run automatically during CI:

```bash
./scripts/smoke.sh
```

Checks performed:
1. Backend health endpoint (`/api/health`).
2. Frontend `index.html` is served.
3. Metrics endpoint (`/api/metrics`) contains `http_requests_total`.

---

## 📦 Packages

Docker images are published to **GitHub Container Registry (GHCR):**

- `ghcr.io/adrian-mihai-marghidan/end-to-end-devops-demo/backend`
- `ghcr.io/adrian-mihai-marghidan/end-to-end-devops-demo/web`

---

## 👤 Author

**Adrian Mihai Marghidan**
