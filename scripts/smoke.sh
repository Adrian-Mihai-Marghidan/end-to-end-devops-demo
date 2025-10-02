#!/usr/bin/env bash
set -euo pipefail

echo "[smoke] Waiting for NGINX/backend on :8081 ..."

# 1) Health
for i in {1..30}; do
  if curl -fsS http://localhost:8081/api/health | grep -qi "ok"; then
    echo "[smoke] backend is ready ✅"
    break
  fi
  echo "[smoke] not ready yet... ($i/30)"
  sleep 2
  if [[ $i -eq 30 ]]; then
    echo "[smoke] ❌ backend never became healthy"
    exit 1
  fi
done

# 2) Index (also primes the request counter)
echo "[smoke] Checking index.html..."
curl -fsS http://localhost:8081/ | grep -qi "<!DOCTYPE html"

# 3) Metrics (must contain http_requests_total)
echo "[smoke] Checking metrics..."
metrics_ok=false
for i in {1..30}; do
  if curl -fsS http://localhost:8081/api/metrics | grep -qi "http_requests_total"; then
    echo "[smoke] metrics OK ✅"
    metrics_ok=true
    break
  fi
  echo "[smoke] metrics not ready yet... ($i/30)"
  sleep 2
done

if [[ "${metrics_ok}" != "true" ]]; then
  echo "[smoke] ❌ metrics never contained 'http_requests_total'"
  echo "[smoke] Dumping first 50 lines of /api/metrics for debugging:"
  curl -fsS http://localhost:8081/api/metrics | head -n 50 || true
  exit 1
fi

echo "[smoke] All checks passed 🎉"
