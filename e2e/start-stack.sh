#!/usr/bin/env bash
# Starts the built API and the web dev server against a test database for the
# end-to-end tests, and waits until both answer. CI uses a localhost Postgres.
# Locally, use the Railway dev database (no Docker, no local Postgres):
#
#   DATABASE_URL=$(railway variables -e development -s dev-postgres --kv | sed -n 's/^DATABASE_PUBLIC_URL=//p') e2e/start-stack.sh
#
# Build the API first (bunx turbo run build --filter=@open-sunsama/api...) and
# migrate the database (cd packages/database && bunx drizzle-kit migrate).
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must point at a local test database}"
case "$DATABASE_URL" in
  *@localhost:* | *@localhost/* | *@127.0.0.1:* | *@127.0.0.1/*) ;;
  # dev-postgres in Railway's development environment
  *@tokaido.proxy.rlwy.net:50839/*) ;;
  *) echo "Refusing to start: DATABASE_URL is neither localhost nor the Railway dev database." >&2; exit 1 ;;
esac

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_PORT="${API_PORT:-3201}"
WEB_PORT="${WEB_PORT:-3207}"
LOG_DIR="${LOG_DIR:-$ROOT/e2e/.logs}"
mkdir -p "$LOG_DIR"

# DOTENV_CONFIG_PATH=/dev/null stops the API from loading apps/api/.env, which
# in a maintainer checkout points at production.
env -i PATH="$PATH" HOME="$HOME" TZ="${TZ:-UTC}" \
  DOTENV_CONFIG_PATH=/dev/null \
  NODE_ENV=development \
  DATABASE_URL="$DATABASE_URL" \
  JWT_SECRET=e2e-secret-0123456789abcdef0123456789 \
  PORT="$API_PORT" \
  API_URL="http://localhost:$API_PORT" \
  WEB_APP_URL="http://localhost:$WEB_PORT" \
  FRONTEND_URL="http://localhost:$WEB_PORT" \
  CORS_ORIGIN="http://localhost:$WEB_PORT" \
  ROLLOVER_ENABLED=false \
  EMAIL_WORKERS_ENABLED=false \
  CALENDAR_SYNC_ENABLED=false \
  RECURRING_ENABLED=false \
  nohup node "$ROOT/apps/api/dist/index.js" >"$LOG_DIR/api.log" 2>&1 &
echo $! >"$LOG_DIR/api.pid"

(
  cd "$ROOT/apps/web"
  VITE_API_URL="http://localhost:$API_PORT" VITE_WS_URL="ws://localhost:$API_PORT" \
    nohup npx vite --port "$WEB_PORT" --strictPort >"$LOG_DIR/web.log" 2>&1 &
  echo $! >"$LOG_DIR/web.pid"
)

wait_for() {
  for _ in $(seq 1 60); do
    # A server that exited (port already taken, crash on start) fails fast
    # instead of letting another process on the port answer for it.
    kill -0 "$(cat "$3")" 2>/dev/null || { echo "Server for $1 exited" >&2; tail -50 "$2" >&2; exit 1; }
    curl -sf "$1" >/dev/null && return 0
    sleep 1
  done
  echo "Timed out waiting for $1" >&2
  tail -50 "$2" >&2
  exit 1
}
wait_for "http://localhost:$API_PORT/health" "$LOG_DIR/api.log" "$LOG_DIR/api.pid"
wait_for "http://localhost:$WEB_PORT/login" "$LOG_DIR/web.log" "$LOG_DIR/web.pid"
echo "API on :$API_PORT and web on :$WEB_PORT are up."
