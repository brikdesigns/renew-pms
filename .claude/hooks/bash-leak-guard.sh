#!/bin/bash
# bash-leak-guard.sh — PreToolUse hook for the Bash tool.
# Blocks commands that would exfiltrate secrets INTO the Claude Code
# transcript (which lives in Anthropic-side telemetry + machine-local logs).
# Companion to secret-scanner.sh (which guards Write/Edit content).
#
# This hook prevents the 2026-05-02 incident class: an agent ran
# `netlify env:list --plain --context production` to survey state, dumping
# 5 production secrets to stdout. The transcript was then a rotation
# obligation. Per Brik secrets policy, prevention beats rotation cadence.
#
# Banlist is high-confidence only — patterns where the command's output
# definitionally contains secret values. False positives block real work,
# so each entry must clear that bar.

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')
[ "$TOOL_NAME" != "Bash" ] && exit 0

CMD=$(echo "$INPUT" | jq -r '.tool_input.command // ""')
[ -z "$CMD" ] && exit 0

FINDINGS=""

# 1. Netlify env dumps — the 2026-05-02 incident vector.
if echo "$CMD" | grep -qE 'netlify[[:space:]]+env:list[^|]*(--plain|--json)'; then
  FINDINGS="${FINDINGS}\n  - 'netlify env:list --plain/--json' dumps every env var. Use 'netlify env:get <KEY>' (single var) or the dashboard."
fi

# 2. Reading machine-level secrets store.
if echo "$CMD" | grep -qE '(^|[[:space:]]|;|&&|\|\|)(cat|less|more|head|tail|bat)[[:space:]]+[^|;&]*~?/\.secrets/'; then
  FINDINGS="${FINDINGS}\n  - reading ~/.secrets/. Source with 'set -a; source <file>; set +a' instead of displaying."
fi

# 3. Reading repo .env files (excluding .env.example).
if echo "$CMD" | grep -qE '(^|[[:space:]]|;|&&|\|\|)(cat|less|more|head|tail|bat)[[:space:]]+[^|;&]*\.env(\.local|\.production|\.development|\.staging)?([[:space:]]|$)' \
   && ! echo "$CMD" | grep -qE '\.env\.(example|sample|template)'; then
  FINDINGS="${FINDINGS}\n  - reading a .env file. These contain secrets — source them, don't display."
fi

# 4. Shell trace mode (echoes every variable expansion to stderr).
if echo "$CMD" | grep -qE '(^|[[:space:]]|;|&&|\|\|)(bash|sh|zsh)[[:space:]]+-[a-zA-Z]*x'; then
  FINDINGS="${FINDINGS}\n  - 'bash/sh/zsh -x' echoes every command (including expanded secrets) to stderr."
fi
if echo "$CMD" | grep -qE '(^|[[:space:]]|;|&&|\|\|)set[[:space:]]+-[a-zA-Z]*x([[:space:]]|;|$)'; then
  FINDINGS="${FINDINGS}\n  - 'set -x' enables shell trace mode. Same risk as 'bash -x'."
fi

# 5. Bare env / printenv (full env dump including any sourced secrets).
#    Allow when explicitly filtered for a non-secret prefix.
if echo "$CMD" | grep -qE '(^|;|&&|\|\|)[[:space:]]*(env|printenv)([[:space:]]*\||[[:space:]]*;|[[:space:]]*&&|[[:space:]]*\|\||[[:space:]]*$)'; then
  FINDINGS="${FINDINGS}\n  - bare 'env' or 'printenv' dumps every variable. Use 'printenv <KEY>' for a single var."
fi

# 6. 1Password reveal not captured into a variable.
#    'op item get ... --reveal' echoes to stdout. Safe forms: V=\$(op item get ... --reveal),
#    op item get ... --reveal > ~/.secrets/<file>, op item get ... --reveal | pbcopy.
if echo "$CMD" | grep -qE 'op[[:space:]]+item[[:space:]]+get[^|>]*--reveal' \
   && ! echo "$CMD" | grep -qE '(=[[:space:]]*\$\(|>[[:space:]]*[^&]|\|[[:space:]]*pbcopy|\|[[:space:]]*tee[[:space:]])'; then
  FINDINGS="${FINDINGS}\n  - 'op item get --reveal' must capture: V=\$(op item get ... --reveal) or redirect to a file/clipboard. Bare invocation prints the secret."
fi

if [ -n "$FINDINGS" ]; then
  REASON="Command would leak secrets into the Claude Code transcript:${FINDINGS}\n\nThe transcript persists in Anthropic-side telemetry and machine-local logs. If this is intentional, run the command outside Claude Code (in your own terminal). See ~/Documents/GitHub/CLAUDE.md § Secrets."

  jq -n --arg reason "$(echo -e "$REASON")" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
fi

exit 0
