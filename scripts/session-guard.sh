#!/usr/bin/env bash
# session-guard.sh — PreToolUse hook for Edit/Write operations
#
# Three checks, each fires at most once per parent shell:
#   1. Warns Claude when the working tree has uncommitted changes from a
#      prior session.
#   2. Warns if the BDS submodule has an uncommitted pointer change.
#   3. Delegates Storybook autostart to the shared BDS helper
#      (brik-bds/scripts/ensure-storybook.sh) so the behavior stays in
#      one place across all BDS consumers.
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

# Once-per-session keying
PARENT_PID=$(ps -o ppid= -p $$ 2>/dev/null | tr -d ' ')
DIRTY_MARKER="/tmp/.renew-pms-session-guard-${PARENT_PID:-unknown}"

# ── Storybook autostart (delegated to shared helper) ──────────────────
ENSURE_STORYBOOK="$HOME/Documents/GitHub/brik/brik-bds/scripts/ensure-storybook.sh"
if [[ -x "$ENSURE_STORYBOOK" ]]; then
  export SESSION_GUARD_PARENT_PID="${PARENT_PID:-unknown}"
  echo "$INPUT" | "$ENSURE_STORYBOOK" || true
fi

# ── Dirty-tree + submodule warnings ───────────────────────────────────
if [[ ! -f "$DIRTY_MARKER" ]]; then
  touch "$DIRTY_MARKER"

  cd "$PROJECT_ROOT"

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

  # BDS submodule pointer check
  if [[ -f "$PROJECT_ROOT/brik-bds/.git" ]]; then
    SUBMODULE_STATUS=$(cd "$PROJECT_ROOT" && git submodule status brik-bds 2>/dev/null || echo "")
    if [[ "$SUBMODULE_STATUS" == +* ]]; then
      echo "⚠️  SESSION GUARD: BDS submodule has uncommitted pointer change."
      echo "   Run ./scripts/bds-sync.sh or commit the submodule update."
      echo ""
    fi
  fi
fi

exit 0
