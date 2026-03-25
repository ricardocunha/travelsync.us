#!/bin/zsh
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

ensure_port_free() {
  local port="$1"
  local label="$2"

  if lsof -iTCP:"$port" -sTCP:LISTEN -n -P >/dev/null 2>&1; then
    echo "${label} port ${port} is already in use."
    echo "Stop the process using that port, then run npm run dev again."
    exit 1
  fi
}

cleanup() {
  if [[ -n "${API_PID:-}" ]]; then
    kill "$API_PID" 2>/dev/null || true
  fi

  if [[ -n "${WEB_PID:-}" ]]; then
    kill "$WEB_PID" 2>/dev/null || true
  fi

  wait ${API_PID:-} 2>/dev/null || true
  wait ${WEB_PID:-} 2>/dev/null || true
}

trap cleanup EXIT INT TERM

ensure_port_free "${API_PORT:-9081}" "Go API"
ensure_port_free 5173 "Web app"

(
  cd apps/api
  go run ./cmd/server
) &
API_PID=$!

(
  npm run dev:web
) &
WEB_PID=$!

while true; do
  if ! kill -0 "$API_PID" 2>/dev/null; then
    wait "$API_PID"
    exit $?
  fi

  if ! kill -0 "$WEB_PID" 2>/dev/null; then
    wait "$WEB_PID"
    exit $?
  fi

  sleep 1
done
