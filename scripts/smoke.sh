#!/usr/bin/env bash
set -euo pipefail

echo "[smoke] Waiting for NGINX/backend on :8081 ..."

# Retry loop for health check
for i in {1..30}; do
  if curl -fsS http://localhost:8081/api/health | grep -i "ok"; then
    echo "[smoke] backend is ready ✅"
    break
  fi
  echo "[smoke] not ready yet... ($i/30)"
  sleep 2
done

echo "[smoke] Checking index.html..."
curl -fsS http://localhost:8081/ | grep -i "<!DOCTYPE html"

echo "[smoke] Checking metrics..."
curl -fsS http://localhost:8081/api/metrics | grep -i "http_requests_total"

echo "[smoke] All checks passed 🎉"