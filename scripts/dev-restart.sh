#!/usr/bin/env bash
set -euo pipefail

# Renew PMS — Dev Server Restart
# Kills any running Next.js dev process, optionally clears the build cache,
# and starts a fresh server.
#
# Usage:
#   ./scripts/dev-restart.sh              # Normal restart
#   ./scripts/dev-restart.sh --no-cache   # Clear .next before restarting (use after BDS/token changes)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

NO_CACHE=false
for arg in "$@"; do
  case "$arg" in
    --no-cache) NO_CACHE=true ;;
    --help|-h)
      echo "Usage: ./scripts/dev-restart.sh [--no-cache]"
      echo ""
      echo "  (default)    Kill existing server, restart"
      echo "  --no-cache   Clear .next cache first (use after BDS or token changes)"
      exit 0
      ;;
  esac
done

cd "$PROJECT_ROOT"

echo ""
echo -e "  ${CYAN}Stopping Next.js dev server...${NC}"
pkill -f "next dev" 2>/dev/null || true
sleep 1

if [ "$NO_CACHE" = true ]; then
  echo -e "  ${YELLOW}Clearing .next cache...${NC}"
  rm -rf .next
fi

echo -e "  ${GREEN}Starting dev server...${NC}"
echo ""
npm run dev
