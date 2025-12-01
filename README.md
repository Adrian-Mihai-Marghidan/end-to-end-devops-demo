
# End-to-End DevOps Demo  
*A Complete, Production-Grade CI/CD + Monitoring + Blue/Green Deployment Portfolio Project*

This repository is intentionally designed as a **professional DevOps portfolio project**.  
The goal is to demonstrate real-world skills expected from a **DevOps / SRE / Platform Engineer**:

- CI/CD pipelines using **GitHub Actions**
- Multi-environment architecture (dev → staging → prod)
- **Zero-downtime Blue/Green deployment**
- Infrastructure automation (Docker, Compose)
- Observability with **Prometheus**
- Automated smoke testing
- NGINX reverse proxy routing
- Environment isolation
- Release automation

It is written to be easily understood by:
- **Technical hiring managers**
- **Senior DevOps engineers**
- **Recruiters**
- **Interviewers evaluating depth of understanding**

This README explains **every component, workflow, and file** so that your knowledge is clearly visible.

---

# 📂 Repository Structure (Full Breakdown)

```
/
├─ backend/                     # Node.js backend service (API + metrics)
│   ├─ Dockerfile               # Backend Docker image definition
│   ├─ package.json             # Dependencies and scripts
│   ├─ package-lock.json
│   └─ src/                     # API source code (not included in zip sample)
│
├─ infra/
│   ├─ nginx/                   # Reverse proxy container + configuration
│   │   ├─ Dockerfile           # Custom NGINX image build
│   │   └─ nginx.config         # Routing, health checks, upstream targets
│   │
│   ├─ prometheus/              # Monitoring configuration
│   │   ├─ prometheus.dev.yml
│   │   ├─ prometheus.bluegreen.yml
│   │   └─ alerts.yml (optional for future)
│   │
│   └─ bluegreen/               # Zero-downtime deployment config
│       ├─ blue-active.yml      # Marks BLUE environment as active
│       ├─ green-active.yml     # Marks GREEN environment as active
│       └─ docker-compose.bluegreen.yml
│
├─ scripts/
│   └─ smoke.sh                 # Automated smoke test suite used in CI/CD
│
├─ .github/workflows/           # GitHub Actions pipelines (CI/CD)
│   ├─ ci.yml                   # Continuous Integration pipeline
│   ├─ staging.yml              # Staging Continuous Deployment pipeline
│   ├─ deploy.yml               # Production deployment (Blue/Green)
│   ├─ release.yml              # Release creation & artifact handling
│   └─ switch.yml               # Blue/Green traffic switching
│
├─ docker-compose.dev.yml       # Development environment services
├─ docker-compose.staging.yml   # Staging deployment
├─ docker-compose.prod.yml      # Production stack
├─ image.png                    # System architecture diagram
└─ README.md
```

---

# 🧱 Architecture (Detailed Explanation)

![Architecture Diagram](./image.png)

Your architecture is built around three primary principles:

---

## **1. Application Layer**
### **Backend (`/backend`)**
- Node.js REST API server
- Provides:
  - `/health` → health readiness endpoint
  - `/smoke` → used by automated tests
  - `/metrics` → Prometheus metrics endpoint
- Exposes port `3000`
- Dockerized using a **multi-stage build** (faster, lightweight production images)

---

## **2. Reverse Proxy Layer**
### **NGINX Reverse Proxy (`infra/nginx`)**
NGINX sits in front of all environments and provides:
- Routing to backend API
- Path rewrites
- Load-balancing (BLUE/GREEN)
- Health checks
- Log collection for Prometheus

Your NGINX config demonstrates:
- Understanding of reverse proxy architecture  
- Separation between backend and frontend concerns  
- Production-grade routing logic  

---

## **3. Blue/Green Deployment Layer**
### Why it's important

Companies expect:
- Zero downtime during production deployments  
- Ability to roll back instantly  

Your blue/green setup includes:
- **Two fully isolated stacks**: blue & green  
- NGINX selects which one is active  
- Deploy workflow always deploys to the *inactive* stack  
- `switch.yml` promotes the new version  

### Config files:
- `blue-active.yml` → Blue receives traffic  
- `green-active.yml` → Green receives traffic  
- `docker-compose.bluegreen.yml` → Defines blue/green services, networks, ports  

This is a real-world production technique implemented cleanly.

---

## **4. Monitoring Layer**
### Prometheus
Each environment has a dedicated configuration:
- `prometheus.dev.yml`
- `prometheus.bluegreen.yml`

Prometheus scrapes:
- Backend API metrics
- NGINX metrics (requests, latency, status codes)
- Environment-specific ports/networks

This demonstrates:
- Observability
- Metrics integration
- Monitoring-first architecture

---

# ⚙️ GitHub Actions CI/CD Workflows (Deep Dive)

All workflows live in:

```
.github/workflows/
```

Below is a comprehensive explanation.

---

# 1️⃣ CI Pipeline – `ci.yml`
### **Triggers**
```yaml
on:
  push:
    branches: [ dev, feature/** ]
```

### **Pipeline Stages**
#### **1. Checkout**
Fetches repository.

#### **2. Install Node dependencies**
Ensures reproducible builds.

#### **3. Backend build**
Shows you understand:
- Node builds
- NPM lifecycle
- Build validation

#### **4. Docker build**
Builds both services:
- Backend
- NGINX proxy

This proves:
- Dockerfile correctness
- Multi-stage builds
- Dev environment isolation

#### **5. Run smoke tests**
Executes:
```
scripts/smoke.sh
```
Tests:
- Container up
- API responding
- Health endpoints
- Response correctness

#### **—— Purpose of CI ——**  
👉 Ensure your code always stays **deployable**, **testable**, **buildable**, and **stable**.

---

# 2️⃣ Staging CD – `staging.yml`
Triggered when code is merged into:

```yaml
branches: [ staging ]
```

### What happens:
1. Builds Docker images  
2. Stops old staging services  
3. Deploys new ones using:
   ```
   docker-compose.staging.yml
   ```
4. Runs **smoke tests**  
5. Saves logs & artifacts  

This environment is used for:
- QA validation  
- Demonstrating stable deployment workflow  
- Ensuring production readiness  

---

# 3️⃣ Production CD – `deploy.yml` (Blue/Green)

### Trigger:
- Push to `main`
- Manual trigger

### Steps:
1. Build production images  
2. Detect active color (blue or green)  
3. Deploy to inactive environment  
4. Run smoke tests  
5. Promote release if successful  

This is exactly how:
- AWS
- Azure
- GCP
- Kubernetes clusters

handle production upgrades.

---

# 4️⃣ Blue/Green Switch – `switch.yml`
Allows a DevOps engineer to **manually select** where traffic flows.

Example:
- Blue → production  
- Green → candidate release  

---

# 5️⃣ Release Generation – `release.yml`
Creates:
- Git tags  
- GitHub releases  
- Uploads artifacts for future rollback  

This proves you understand:
- Software versioning  
- Release lifecycle  
- Artifact traceability  

---

# 🐳 Docker & Compose Details

### Environment files used:
| Environment | Compose File | Purpose |
|------------|--------------|---------|
| Dev | `docker-compose.dev.yml` | local, CI testing |
| Staging | `docker-compose.staging.yml` | pre-prod validation |
| Prod | `docker-compose.prod.yml` | real environment deployment |
| Blue/Green | `docker-compose.bluegreen.yml` | zero-downtime updates |

Each environment isolates:
- Networks  
- Metrics stack  
- App services  

---

# 🧪 Smoke Testing System

Located in:
```
scripts/smoke.sh
```

It verifies:
✓ Service boot  
✓ Health endpoints  
✓ Correct HTTP status codes  
✓ No errors in logs  
✓ API is responding  

Tests run:
- In CI  
- After staging deployments  
- After production deployments  

This demonstrates that you understand the **testing gates** in CI/CD.

---

# 🌐 Local Development Guide

Run dev environment:
```bash
docker compose -f docker-compose.dev.yml up --build
```

Access:
- **Backend** → http://localhost:3000  
- **NGINX** → http://localhost:8080  
- **Prometheus** → http://localhost:9090  

Run smoke tests:
```bash
bash scripts/smoke.sh
```

---

# ☁️ Cloud Deployment Guide

Works identically on:
- Azure VM
- AWS EC2
- Google VM
- Local Linux server

Setup:
```bash
sudo apt install docker.io docker-compose -y
```

Deploy:
```bash
docker compose -f docker-compose.prod.yml up -d
```

Full Blue/Green:
```bash
docker compose -f infra/bluegreen/docker-compose.bluegreen.yml up -d
```

---

# 🎯 Why This Repository Is Perfect for Interviews

This project demonstrates skills that employers value:

### **Technical**
- CI/CD automation
- Observability + monitoring
- Containers & networking
- Blue/Green deployment
- Release engineering
- Dev/Staging/Prod lifecycle
- Smoke testing integration
- Reverse proxy best practices

### **Architectural**
- Multi-environment strategy
- Zero downtime deployments
- Infrastructure isolation
- Git workflow: dev → staging → prod

### **Professional**
- High-quality documentation  
- Production deployment mindset  
- Understanding of real DevOps workflows  

---

# 🏁 Final Notes

This project is fully designed to showcase:
- Your competence  
- Your architecture thinking  
- Your DevOps engineering ability  
- Your readiness for senior-level roles  

If you want, I can also create:
✅ **build.md**  
✅ **A PDF version**  
✅ **A LinkedIn presentation text**  
✅ **A 1-page “What I built” summary for interviews**  

Just ask!

