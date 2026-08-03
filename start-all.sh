#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Voya — Start ALL services (run this in your Mac Terminal)
# ─────────────────────────────────────────────────────────────
set -a
source "$(dirname "$0")/.env" 2>/dev/null || true
set +a

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🏠 Starting Voya services from $ROOT"
echo ""

# Kill anything on the ports first
for PORT in 3005 3006 3010 3200; do
  PID=$(lsof -ti:$PORT 2>/dev/null)
  [ -n "$PID" ] && kill -9 $PID && echo "  cleared :$PORT (pid $PID)"
done
sleep 1

# Search service
cd "$ROOT/services/search-service"
SEARCH_SERVICE_PORT=3005 NODE_ENV=development npx tsx src/index.ts \
  > /tmp/voya-search.log 2>&1 &
echo "✓ search-service  → :3005  (log: /tmp/voya-search.log)"

# AI service
cd "$ROOT/services/ai-service"
npx tsx src/index.ts > /tmp/voya-ai.log 2>&1 &
echo "✓ ai-service      → :3006  (log: /tmp/voya-ai.log)"

# API Gateway
cd "$ROOT/services/api-gateway"
API_GATEWAY_PORT=3010 NODE_ENV=development npx tsx src/index.ts \
  > /tmp/voya-gateway.log 2>&1 &
echo "✓ api-gateway     → :3010  (log: /tmp/voya-gateway.log)"

# Frontend
cd "$ROOT/apps/frontend"
PORT=3200 node_modules/.bin/next dev \
  > /tmp/voya-frontend.log 2>&1 &
echo "✓ frontend        → :3200  (log: /tmp/voya-frontend.log)"

echo ""
echo "⏳ Waiting for services to start..."
sleep 20

echo ""
echo "Health checks:"
curl -s http://localhost:3005/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  search:  {d[\"status\"]}')" 2>/dev/null || echo "  search:  ✗ not ready"
curl -s http://localhost:3006/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  ai:      {d[\"status\"]} (key={d[\"apiKeyConfigured\"]})')" 2>/dev/null || echo "  ai:      ✗ not ready"
curl -s http://localhost:3010/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  gateway: {d[\"status\"]}')" 2>/dev/null || echo "  gateway: ✗ not ready"
curl -s -o /dev/null -w "  frontend: %{http_code}\n" http://localhost:3200 2>/dev/null || echo "  frontend: ✗ not ready"

echo ""
echo "✅ Open http://localhost:3200 in your browser"
echo ""
echo "Live logs:"
echo "  tail -f /tmp/voya-frontend.log"
echo "  tail -f /tmp/voya-ai.log"
echo "  tail -f /tmp/voya-search.log"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep terminal open and wait for Ctrl+C
wait
