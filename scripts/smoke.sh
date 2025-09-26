#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-http://localhost:8081}"

echo "[smoke] Hitting $HOST …"
curl -fsS "$HOST/" | grep -i "<!DOCTYPE html" >/dev/null
curl -fsS "$HOST/api/health" | grep -i "ok" >/dev/null
curl -fsS "$HOST/api/metrics" | grep -i "http_requests_total" >/dev/null
echo "[smoke] OK"

