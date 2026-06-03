#!/usr/bin/env bash
# session-guard.sh — PreToolUse hook for Edit/Write operations
# Warns Claude when the working tree has uncommitted changes from a prior session.
# Runs once per session (creates a temp marker to avoid repeat warnings).
#
# Hook input: JSON on stdin with tool_name and tool_input fields.
# Exit 0 = allow, non-zero = block (we always allow but warn via stdout).

set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name')

# Only trigger on file-modifying tools
case "$TOOL_NAME" in
  Edit|Write|NotebookEdit) ;;
  *) exit 0 ;;
esac

PROJECT_ROOT="/Users/nickstanerson/Documents/GitHub/product/renew-pms"
MARKER="/tmp/.renew-pms-session-guard-$$"

# Only run once per session (keyed to parent shell PID)
PARENT_PID=$(ps -o ppid= -p $$ 2>/dev/null | tr -d ' ')
MARKER="/tmp/.renew-pms-session-guard-${PARENT_PID:-unknown}"

if [[ -f "$MARKER" ]]; then
  exit 0
fi

touch "$MARKER"

cd "$PROJECT_ROOT"

# Check for uncommitted changes
DIRTY_COUNT=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [[ "$DIRTY_COUNT" -gt 0 ]]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  echo ""
  echo "⚠️  SESSION GUARD: $DIRTY_COUNT uncommitted change(s) on '$BRANCH'."
  echo "   These may be from a prior session. Review before continuing:"
  echo ""
  git status --short 2>/dev/null | head -15
  if [[ "$DIRTY_COUNT" -gt 15 ]]; then
    echo "   ... and $((DIRTY_COUNT - 15)) more"
  fi
  echo ""
  echo "   → Commit, stash, or discard before starting new work."
  echo ""
fi

exit 0
