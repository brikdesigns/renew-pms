#!/usr/bin/env bash
# worktree-check.sh — SessionStart + PreToolUse hook that catches two
# classes of worktree drift:
#
# 1. Primary worktree on a task branch (existing — delegated to
#    scripts/worktree-guard.sh when that script is present, e.g. in brik-bds).
#
# 2. Edit/Write targeting a file in a different worktree than the session's
#    launch directory (NEW — catches the 2026-04-28 settings-skeletons class
#    of drift where the agent edits one worktree while bash commands
#    silently operate on another).
#
# This hook is non-blocking by default (warn only). Set BDS_WORKTREE_GUARD=strict
# to convert PreToolUse warnings into blocking errors.
#
# Limitation: the hook process cannot read Claude Code's internal Bash-tool
# cwd state, so it cannot directly catch "bash cwd drifted to primary while
# Edit absolute paths still work." The Edit-side check below is a partial
# proxy: it warns when the target file's worktree differs from the hook's
# launch cwd worktree. The durable defense remains absolute paths in Bash —
# see ~/.claude/projects/<project>/memory/feedback_worktree_dev_server.md.

set -eu

INPUT="${1:-}"
if [ -z "$INPUT" ] && [ ! -t 0 ]; then
  INPUT="$(cat || true)"
fi

HOOK_EVENT=""
TOOL_NAME=""
FILE_PATH=""
if [ -n "$INPUT" ] && command -v jq >/dev/null 2>&1; then
  HOOK_EVENT="$(printf '%s' "$INPUT" | jq -r '.hook_event_name // empty' 2>/dev/null || true)"
  TOOL_NAME="$(printf '%s' "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null || true)"
  FILE_PATH="$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"
fi

# ── Edit/Write/MultiEdit cross-worktree check ──
# Fires on PreToolUse for file-modifying tools. Compares the target file's
# worktree to the hook's own cwd worktree — they should match unless work
# legitimately spans repos.
if [ "$HOOK_EVENT" = "PreToolUse" ] && [ -n "$FILE_PATH" ]; then
  case "$TOOL_NAME" in
    Edit|Write|MultiEdit)
      FILE_DIR="$(dirname "$FILE_PATH")"
      if [ -d "$FILE_DIR" ]; then
        FILE_WT="$(git -C "$FILE_DIR" rev-parse --show-toplevel 2>/dev/null || echo "")"
        HOOK_WT="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"

        if [ -n "$FILE_WT" ] && [ -n "$HOOK_WT" ] && [ "$FILE_WT" != "$HOOK_WT" ]; then
          printf '\n[worktree-check] ⚠️  cross-worktree edit detected:\n' >&2
          printf '  Session worktree: %s\n' "$HOOK_WT" >&2
          printf '  File worktree:    %s\n' "$FILE_WT" >&2
          printf '  File path:        %s\n' "$FILE_PATH" >&2
          printf '  This is the silent-drift pattern. Verify before continuing:\n' >&2
          printf '    1. Is this edit intentional (e.g. cross-repo work)?\n' >&2
          printf '    2. If unintentional: confirm the bash cwd with `pwd` and run\n' >&2
          printf '       `git -C "%s" status` to see what is actually on disk.\n' "$FILE_WT" >&2
          if [ "${BDS_WORKTREE_GUARD:-warn}" = "strict" ]; then
            printf '  BDS_WORKTREE_GUARD=strict — blocking edit.\n' >&2
            exit 1
          fi
        fi
      fi
      ;;
  esac
fi

# ── Existing leg: delegate to scripts/worktree-guard.sh when present ──
REPO_ROOT=""
if [ -n "$FILE_PATH" ]; then
  REPO_ROOT="$(git -C "$(dirname "$FILE_PATH")" rev-parse --show-toplevel 2>/dev/null || true)"
fi
if [ -z "$REPO_ROOT" ]; then
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
fi

[ -z "$REPO_ROOT" ] && exit 0

GUARD="$REPO_ROOT/scripts/worktree-guard.sh"
[ ! -x "$GUARD" ] && exit 0

MODE="${BDS_WORKTREE_GUARD:-warn}"
if [ "$MODE" = "strict" ]; then
  "$GUARD" --strict
  exit $?
fi

"$GUARD"
exit 0
