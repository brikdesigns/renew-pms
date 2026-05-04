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

# Strip heredoc bodies before matching. Heredoc content is data the shell
# passes verbatim to a consuming tool (e.g. `git commit -m "$(cat <<'EOF'...
# EOF)"`); it is NOT executed. Without this, commit messages and PR bodies
# documenting the leak vectors (``~/.secrets/...``, ``grep ...``) trigger
# the hook against their own incident-prevention prose.
CMD_FOR_MATCH=$(printf '%s' "$CMD" | awk '
  in_heredoc {
    # Heredoc body ends on a line that is exactly the delimiter, optionally
    # followed by `)"` etc. (the heredoc closes the surrounding $(...)).
    line = $0
    sub(/[[:space:]]*[\\\)\"]+[[:space:]]*$/, "", line)
    if (line == delim) { in_heredoc = 0 }
    next
  }
  /<<-?[[:space:]]*[\047"]?[A-Za-z_][A-Za-z_0-9]*[\047"]?/ {
    line = $0
    # Strip everything up to and including `<<` plus optional `-` and whitespace
    # and one optional opening quote.
    sub(/.*<<-?[[:space:]]*[\047"]?/, "", line)
    # Now `line` starts with the delim word; keep only the leading word chars.
    sub(/[^A-Za-z_0-9].*/, "", line)
    delim = line
    if (delim != "") in_heredoc = 1
    print
    next
  }
  { print }
')

FINDINGS=""

# 1. Netlify env dumps — the 2026-05-02 incident vector.
if echo "$CMD_FOR_MATCH" | grep -qE 'netlify[[:space:]]+env:list[^|]*(--plain|--json)'; then
  FINDINGS="${FINDINGS}\n  - 'netlify env:list --plain/--json' dumps every env var. Use 'netlify env:get <KEY>' (single var) or the dashboard."
fi

# Tools that surface file content to stdout/stderr — widened 2026-05-04 after
# `grep PATTERN ~/.secrets/*.env` leaked a token in a session where the prior
# matcher only covered cat/less/more/head/tail/bat. Anything that opens a file
# and prints its contents qualifies, including content searchers (grep/rg/ag)
# and stream transformers (sed/awk/jq) that take a file path argument.
# Editors (vim/nano) aren't included — Claude Code doesn't drive interactive
# TUIs in practice.
#
# Match strategy: detect (a) tool-presence and (b) secret-path-presence
# anywhere in the command, AND'd. The earlier "tool-then-path on a single
# argument boundary" form was too brittle — it failed on commands with `|`
# inside a quoted arg (e.g. `grep "FOO\|BAR" ~/.secrets/file`), letting the
# 2026-05-04 leak through. Cross-pipe matches are fine: if the command
# composition reads a secret file at any stage, it leaks.
SECRET_READING_TOOL_RE='(^|[^a-zA-Z0-9_-])(cat|less|more|head|tail|bat|grep|egrep|fgrep|rg|ag|sed|awk|gawk|jq|xxd|od|hexdump|strings|view)([^a-zA-Z0-9_-]|$)'

# 2. Reading machine-level secrets store.
if echo "$CMD_FOR_MATCH" | grep -qE "$SECRET_READING_TOOL_RE" \
   && echo "$CMD_FOR_MATCH" | grep -qE "~?/\\.secrets/"; then
  FINDINGS="${FINDINGS}\n  - reading ~/.secrets/. Source with 'set -a; source <file>; set +a' instead of displaying."
fi

# 3. Reading repo .env files (excluding .env.example/.sample/.template).
#    Path detection: `.env` as a standalone token OR with a known suffix,
#    bounded so `.env.example` doesn't trigger here (it falls through to the
#    explicit exclusion below).
if echo "$CMD_FOR_MATCH" | grep -qE "$SECRET_READING_TOOL_RE" \
   && echo "$CMD_FOR_MATCH" | grep -qE '(^|[[:space:]/])\.env(\.local|\.production|\.development|\.staging)?([[:space:]]|$|>|<|;|\|)' \
   && ! echo "$CMD_FOR_MATCH" | grep -qE '\.env\.(example|sample|template)'; then
  FINDINGS="${FINDINGS}\n  - reading a .env file. These contain secrets — source them, don't display."
fi

# 4. Shell trace mode (echoes every variable expansion to stderr).
if echo "$CMD_FOR_MATCH" | grep -qE '(^|[[:space:]]|;|&&|\|\|)(bash|sh|zsh)[[:space:]]+-[a-zA-Z]*x'; then
  FINDINGS="${FINDINGS}\n  - 'bash/sh/zsh -x' echoes every command (including expanded secrets) to stderr."
fi
if echo "$CMD_FOR_MATCH" | grep -qE '(^|[[:space:]]|;|&&|\|\|)set[[:space:]]+-[a-zA-Z]*x([[:space:]]|;|$)'; then
  FINDINGS="${FINDINGS}\n  - 'set -x' enables shell trace mode. Same risk as 'bash -x'."
fi

# 5. Bare env / printenv (full env dump including any sourced secrets).
#    Allow when explicitly filtered for a non-secret prefix.
if echo "$CMD_FOR_MATCH" | grep -qE '(^|;|&&|\|\|)[[:space:]]*(env|printenv)([[:space:]]*\||[[:space:]]*;|[[:space:]]*&&|[[:space:]]*\|\||[[:space:]]*$)'; then
  FINDINGS="${FINDINGS}\n  - bare 'env' or 'printenv' dumps every variable. Use 'printenv <KEY>' for a single var."
fi

# 6. 1Password reveal not captured into a variable.
#    'op item get ... --reveal' echoes to stdout. Safe forms: V=\$(op item get ... --reveal),
#    op item get ... --reveal > ~/.secrets/<file>, op item get ... --reveal | pbcopy.
if echo "$CMD_FOR_MATCH" | grep -qE 'op[[:space:]]+item[[:space:]]+get[^|>]*--reveal' \
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
