#!/usr/bin/env bash
# Voya — start all backend services
set -a
source "$(dirname "$0")/.env"
set +a

ROOT="$(dirname "$0")"

echo "Starting Voya services..."

# Kill anything on service ports first
for PORT in 3005 3006 3010; do
  lsof -ti:$PORT | xargs kill -9 2>/dev/null && echo "  cleared port $PORT"
done

# Search service
cd "$ROOT/services/search-service"
SEARCH_SERVICE_PORT=3005 NODE_ENV=development node \
  --import=/opt/homebrew/lib/node_modules/tsx/dist/cli.mjs src/index.ts \
  > /tmp/search-service.log 2>&1 &
echo "  search-service → pid $! (port 3005)"

# AI service — compiled to avoid tsx IPC sandbox restriction
cd "$ROOT/services/ai-service"
node --import=/opt/homebrew/lib/node_modules/tsx/dist/cli.mjs src/index.ts \
  > /tmp/ai-service.log 2>&1 &
echo "  ai-service     → pid $! (port 3006)"

# API Gateway
cd "$ROOT/services/api-gateway"
API_GATEWAY_PORT=3010 BOOKING_SERVICE_PORT=4003 USER_SERVICE_PORT=4001 \
  NODE_ENV=development node \
  --import=/opt/homebrew/lib/node_modules/tsx/dist/cli.mjs src/index.ts \
  > /tmp/gateway.log 2>&1 &
echo "  api-gateway    → pid $! (port 3010)"

sleep 2
echo ""
echo "Health checks:"
curl -s http://localhost:3005/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  search: {d.get(\"status\")}')" 2>/dev/null || echo "  search: not ready"
curl -s http://localhost:3006/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  ai:     {d.get(\"status\")} (key={d.get(\"apiKeyConfigured\")})')" 2>/dev/null || echo "  ai: not ready"
curl -s http://localhost:3010/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  gateway:{d.get(\"status\")}')" 2>/dev/null || echo "  gateway: not ready"
echo ""
echo "Frontend: http://localhost:3200  (run: cd apps/frontend && PORT=3200 pnpm dev)"
