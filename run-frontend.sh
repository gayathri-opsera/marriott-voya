#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Voya — 10-Agent AI Travel Concierge
# Run this in your Mac Terminal (NOT inside Cursor)
# ─────────────────────────────────────────────────────────────────────────────

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/apps/frontend"

echo ""
echo "  ▲ Voya — AI Travel Concierge (10-agent system)"
echo "  ─────────────────────────────────────────────"
echo ""
echo "  Agents:"
echo "  1. Safety / Destination Validation"
echo "  2. Hotel & Villa Search (Marriott PRIMARY)"
echo "  3. Restaurant Search"
echo "  4. Attractions Search"
echo "  5. Activities (Bonvoy Tours)"
echo "  6. Weather Forecast"
echo "  7. Local Transport"
echo "  8. Budget Tracker"
echo "  9. Flights"
echo " 10. Itinerary Assembly"
echo ""

# Raise file descriptor limit (fixes EMFILE errors in Next.js watchers)
ulimit -n 65536 2>/dev/null || true

# Clear port 3200
echo "  Clearing port 3200..."
lsof -ti :3200 | xargs kill -9 2>/dev/null || true
sleep 1

cd "$FRONTEND_DIR"

echo "  Starting at http://localhost:3200"
echo ""
echo "  Key pages:"
echo "  - http://localhost:3200/assistant  ← 10-agent chat + live map"
echo "  - http://localhost:3200/search?q=Hyderabad"
echo "  - http://localhost:3200/search?q=Austin+Texas"
echo ""
echo "  Try asking the AI:"
echo "  'I want to visit Hyderabad in December, 2 guests, budget \$3000'"
echo "  'Honeymoon in Amalfi, December 2026, budget £6,000'"
echo ""

# Start Next.js (runs in foreground — keep Terminal open)
PORT=3200 node_modules/.bin/next dev -p 3200
