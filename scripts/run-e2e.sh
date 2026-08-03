#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Voya — Full E2E Test Runner
# ──────────────────────────────────────────────────────────────────────────────
# Usage:  ./scripts/run-e2e.sh [--headed] [--spec <pattern>]
#
# Steps:
#   1. Generate seed data
#   2. Start backend services (search-service, ai-service, api-gateway)
#   3. Start frontend dev server (port 3200)
#   4. Wait for all services to be healthy
#   5. Run Playwright E2E tests
#   6. Print screenshot paths
#   7. Clean up background processes
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/apps/frontend"

# ── Colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

ok()   { echo -e "${GREEN}  ✓ $*${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $*${NC}"; }
fail() { echo -e "${RED}  ✗ $*${NC}"; }
step() { echo -e "\n${CYAN}▶ $*${NC}"; }

# ── Argument parsing ──────────────────────────────────────────────────────────
HEADED=""
SPEC=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --headed) HEADED="--headed"; shift ;;
    --spec)   SPEC="$2"; shift 2 ;;
    *) shift ;;
  esac
done

# ── Cleanup on exit ───────────────────────────────────────────────────────────
PIDS=()
cleanup() {
  echo ""
  step "Shutting down background processes..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null && echo "  killed $pid" || true
  done
  # Also kill by port
  for port in 3200 3005 3006 3010; do
    lsof -ti:"$port" | xargs kill -9 2>/dev/null || true
  done
  echo ""
  ok "Cleanup complete."
}
trap cleanup EXIT INT TERM

# ── Step 1: Seed data ─────────────────────────────────────────────────────────
step "Generating seed data..."
cd "$ROOT"
npx tsx scripts/seed-data.ts
ok "Seed data ready (apps/frontend/public/seed/)"

# ── Step 2: Kill existing processes on service ports ─────────────────────────
step "Clearing service ports (3005 / 3006 / 3010 / 3200)..."
for port in 3005 3006 3010 3200; do
  lsof -ti:"$port" | xargs kill -9 2>/dev/null && echo "  cleared :$port" || true
done
sleep 1

# ── Step 3: Start backend services ───────────────────────────────────────────
step "Starting backend services..."

# Load env
set -a; source "$ROOT/.env" 2>/dev/null || true; set +a

# Search service
cd "$ROOT/services/search-service"
SEARCH_SERVICE_PORT=3005 NODE_ENV=development node \
  --import=/opt/homebrew/lib/node_modules/tsx/dist/cli.mjs src/index.ts \
  > /tmp/voya-search.log 2>&1 &
PIDS+=("$!")
ok "search-service → pid $! → port 3005"

# AI service
cd "$ROOT/services/ai-service"
node --import=/opt/homebrew/lib/node_modules/tsx/dist/cli.mjs src/index.ts \
  > /tmp/voya-ai.log 2>&1 &
PIDS+=("$!")
ok "ai-service → pid $! → port 3006"

# API Gateway
cd "$ROOT/services/api-gateway"
API_GATEWAY_PORT=3010 NODE_ENV=development node \
  --import=/opt/homebrew/lib/node_modules/tsx/dist/cli.mjs src/index.ts \
  > /tmp/voya-gateway.log 2>&1 &
PIDS+=("$!")
ok "api-gateway → pid $! → port 3010"

# ── Step 4: Start frontend ────────────────────────────────────────────────────
step "Starting Next.js frontend (port 3200)..."
cd "$FRONTEND"
PORT=3200 pnpm dev > /tmp/voya-frontend.log 2>&1 &
PIDS+=("$!")
ok "frontend → pid $!"

# ── Step 5: Health checks ─────────────────────────────────────────────────────
step "Waiting for services to be healthy..."

wait_for() {
  local url=$1 name=$2 max=${3:-30}
  local i=0
  while ! curl -sf "$url" > /dev/null 2>&1; do
    i=$((i+1))
    if [ $i -ge "$max" ]; then
      warn "$name did not start in time — continuing anyway"
      return 1
    fi
    sleep 1
  done
  ok "$name is ready"
}

wait_for "http://localhost:3005/health"  "search-service" 30
wait_for "http://localhost:3006/health"  "ai-service"     30
wait_for "http://localhost:3010/health"  "api-gateway"    30
wait_for "http://localhost:3200"         "frontend"       60

# ── Step 6: Show health status ────────────────────────────────────────────────
step "Service health summary:"
curl -s http://localhost:3005/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  search:  {d.get(\"status\")}')" 2>/dev/null || warn "  search: no response"
curl -s http://localhost:3006/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  ai:      {d.get(\"status\")} (key={d.get(\"apiKeyConfigured\")})')" 2>/dev/null || warn "  ai: no response"
curl -s http://localhost:3010/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  gateway: {d.get(\"status\")}')" 2>/dev/null || warn "  gateway: no response"

# ── Step 7: Run Playwright E2E tests ─────────────────────────────────────────
step "Running Playwright E2E tests..."
cd "$FRONTEND"

PLAYWRIGHT_BASE_URL=http://localhost:3200

PW_ARGS="--reporter=list"
[ -n "$HEADED" ]  && PW_ARGS="$PW_ARGS --headed"
[ -n "$SPEC" ]    && PW_ARGS="$PW_ARGS --grep \"$SPEC\""

# Use reuseExistingServer so Playwright doesn't start a 2nd dev server
set +e
npx playwright test $PW_ARGS
PW_EXIT=$?
set -e

# ── Step 8: Screenshots summary ───────────────────────────────────────────────
step "Screenshots taken:"
if [ -d "$FRONTEND/e2e/screenshots" ]; then
  ls "$FRONTEND/e2e/screenshots"/*.png 2>/dev/null | while read f; do
    echo "  📸 $f"
  done
else
  warn "No screenshots directory found"
fi

# ── Step 9: Result ────────────────────────────────────────────────────────────
echo ""
if [ $PW_EXIT -eq 0 ]; then
  ok "All E2E tests passed! ✓"
else
  fail "Some E2E tests failed (exit $PW_EXIT)"
fi

echo ""
echo "  Logs:"
echo "    Frontend:  tail -f /tmp/voya-frontend.log"
echo "    Search:    tail -f /tmp/voya-search.log"
echo "    AI:        tail -f /tmp/voya-ai.log"
echo "    Gateway:   tail -f /tmp/voya-gateway.log"
echo ""
echo "  HTML report: cd $FRONTEND && pnpm test:e2e:report"
echo ""

exit $PW_EXIT
