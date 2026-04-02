#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Agent Preflight Check (shared template)
# Source: brik-llm/scripts/shared/product-health/agent-preflight.sh
# Sync:   brik-llm/scripts/shared/product-health/sync.sh
#
# Multi-agent coordination: workstream claiming, conflict
# detection, migration safety.
#
# Reads project-specific config from scripts/project.env
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$SCRIPT_DIR/project.env"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "ERROR: $CONFIG_FILE not found. Create it from project.env.example."
  exit 1
fi

# shellcheck source=/dev/null
source "$CONFIG_FILE"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

WORKSTREAM_FILE="$PROJECT_ROOT/.claude/workstreams.json"

# ── CLI flags ──
ACTION="check"
CLAIM_DESC=""
CLAIM_FILES=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --claim)   ACTION="claim"; CLAIM_DESC="$2"; shift 2 ;;
    --files)   CLAIM_FILES="$2"; shift 2 ;;
    --release) ACTION="release"; shift ;;
    --list)    ACTION="list"; shift ;;
    --help|-h)
      echo "Usage: ./scripts/agent-preflight.sh [OPTIONS]"
      echo ""
      echo "  (default)                        Check for conflicts"
      echo "  --claim \"description\" --files \"pattern\"  Claim a workstream"
      echo "  --release                        Release your claim"
      echo "  --list                           List active workstreams"
      exit 0
      ;;
    *) shift ;;
  esac
done

pass()  { echo -e "  ${GREEN}[OK]${NC}    $1"; }
fail()  { echo -e "  ${RED}[FAIL]${NC}  $1"; }
warn()  { echo -e "  ${YELLOW}[WARN]${NC}  $1"; }
info()  { echo -e "  ${CYAN}[INFO]${NC}  $1"; }
dim()   { echo -e "  ${DIM}$1${NC}"; }

cd "$PROJECT_ROOT"

# Ensure workstream dir exists
mkdir -p "$(dirname "$WORKSTREAM_FILE")"

# ── Initialize workstream file if missing ──
if [ ! -f "$WORKSTREAM_FILE" ]; then
  echo '{"workstreams": [], "version": 1}' > "$WORKSTREAM_FILE"
fi

# ── Cleanup stale entries (>4 hours old) ──
cleanup_stale() {
  local now
  now=$(date +%s)
  local cutoff=$((now - 14400))  # 4 hours

  python3 -c "
import json, sys
with open('$WORKSTREAM_FILE') as f:
    data = json.load(f)

active = [w for w in data.get('workstreams', []) if w.get('claimed_at', 0) > $cutoff]
removed = len(data.get('workstreams', [])) - len(active)
data['workstreams'] = active

with open('$WORKSTREAM_FILE', 'w') as f:
    json.dump(data, f, indent=2)

if removed > 0:
    print(f'Cleaned up {removed} stale workstream(s)')
" 2>/dev/null || true
}

# ── List active workstreams ──
list_workstreams() {
  cleanup_stale
  python3 -c "
import json, datetime
with open('$WORKSTREAM_FILE') as f:
    data = json.load(f)

ws = data.get('workstreams', [])
if not ws:
    print('  No active workstreams')
else:
    for w in ws:
        ts = datetime.datetime.fromtimestamp(w['claimed_at']).strftime('%H:%M')
        print(f\"  {w['description']} ({w.get('agent', 'unknown')}) @ {ts}\")
        if w.get('files'):
            print(f\"    Files: {w['files']}\")
" 2>/dev/null
}

# ── Check for conflicts ──
check_conflicts() {
  cleanup_stale

  echo ""
  echo "========================================="
  echo "  ${PROJECT_NAME:-Project} — Agent Preflight"
  echo "  $(date '+%Y-%m-%d %H:%M')"
  echo "========================================="

  echo ""
  echo "── Active Workstreams ──"
  list_workstreams

  echo ""
  echo "── Git Status ──"

  MAIN_BRANCH="${MAIN_BRANCH:-main}"
  STAGING_BRANCH="${STAGING_BRANCH:-staging}"
  CURRENT=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  info "Current branch: $CURRENT"

  # Pull latest
  git fetch origin --quiet 2>/dev/null || warn "Could not fetch origin"

  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    warn "$DIRTY uncommitted change(s)"
  else
    pass "Working tree clean"
  fi

  # Feature branches
  echo ""
  echo "── Active Feature Branches ──"
  FEATURE_BRANCHES=$(git branch -r 2>/dev/null | grep -E 'feat/|fix/|chore/' | head -10)
  if [ -n "$FEATURE_BRANCHES" ]; then
    echo "$FEATURE_BRANCHES" | while read -r b; do
      LAST_COMMIT=$(git log -1 --format='%ar' "$b" 2>/dev/null || echo "unknown")
      info "$(echo "$b" | sed 's/origin\///')  ($LAST_COMMIT)"
    done
  else
    pass "No active feature branches"
  fi

  # Migration safety
  MIGRATION_DIR="${MIGRATION_DIR:-supabase/migrations}"
  if [ -d "$MIGRATION_DIR" ]; then
    echo ""
    echo "── Migration Safety ──"

    LATEST=$(ls -1 "$MIGRATION_DIR"/*.sql 2>/dev/null | sort | tail -1 | xargs basename 2>/dev/null | grep -oE '^[0-9]+' || echo "00000")
    NEXT=$(printf "%05d" $((10#$LATEST + 1)))
    info "Latest migration: $LATEST"
    info "Next available:   $NEXT"

    # Check for untracked migration files
    UNTRACKED=$(git ls-files --others --exclude-standard "$MIGRATION_DIR/" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$UNTRACKED" -gt 0 ]; then
      fail "$UNTRACKED untracked migration file(s) — commit immediately!"
    else
      pass "All migration files tracked"
    fi
  fi

  # Recent push activity
  echo ""
  echo "── Recent Activity ──"
  LAST_PUSH=$(git log -1 --format='%ar' "origin/$STAGING_BRANCH" 2>/dev/null || echo "unknown")
  info "Last push to $STAGING_BRANCH: $LAST_PUSH"

  echo ""
}

# ── Claim a workstream ──
claim_workstream() {
  if [ -z "$CLAIM_DESC" ]; then
    echo "ERROR: --claim requires a description"
    exit 1
  fi

  cleanup_stale

  local agent_id
  agent_id="agent-$$-$(date +%s)"

  python3 -c "
import json, time
with open('$WORKSTREAM_FILE') as f:
    data = json.load(f)

# Check for file conflicts
new_files = '$CLAIM_FILES'
if new_files:
    for w in data.get('workstreams', []):
        existing = w.get('files', '')
        if existing and new_files:
            # Simple overlap check — glob patterns
            print(f\"WARNING: Potential overlap with '{w['description']}' (files: {existing})\")

data.setdefault('workstreams', []).append({
    'description': '$CLAIM_DESC',
    'files': '$CLAIM_FILES',
    'agent': '$agent_id',
    'claimed_at': int(time.time())
})

with open('$WORKSTREAM_FILE', 'w') as f:
    json.dump(data, f, indent=2)

print(f'Claimed: $CLAIM_DESC')
if '$CLAIM_FILES':
    print(f'Files:   $CLAIM_FILES')
" 2>/dev/null
}

# ── Release workstream ──
release_workstream() {
  python3 -c "
import json
with open('$WORKSTREAM_FILE') as f:
    data = json.load(f)

before = len(data.get('workstreams', []))
# Release the most recent entry (current agent)
if data.get('workstreams'):
    released = data['workstreams'].pop()
    print(f\"Released: {released['description']}\")
else:
    print('No active workstreams to release')

with open('$WORKSTREAM_FILE', 'w') as f:
    json.dump(data, f, indent=2)
" 2>/dev/null
}

# ── Execute ──
case "$ACTION" in
  check)   check_conflicts ;;
  claim)   claim_workstream ;;
  release) release_workstream ;;
  list)    list_workstreams ;;
esac
