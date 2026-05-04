#!/bin/bash
# secret-scanner.sh — PreToolUse hook for Write/Edit/NotebookEdit.
# Blocks Claude from writing secrets into source files BEFORE they hit disk.
# Companion to bash-leak-guard.sh (Bash command exfiltration).
#
# Patterns tuned for Brik stack: Supabase, Resend, Notion, Anthropic,
# Stripe, Netlify, Google, GitHub, Slack.

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

# Skip binary files and config files that legitimately contain tokens
case "$FILE_PATH" in
  *.png|*.jpg|*.gif|*.ico|*.woff|*.woff2|*.ttf|*.svg|*.zip|*.tar|*.gz) exit 0 ;;
  *.env|*.env.*) exit 0 ;;
  *settings.local.json) exit 0 ;;
  */.credentials*) exit 0 ;;
esac

if [ "$TOOL_NAME" = "Write" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // ""')
elif [ "$TOOL_NAME" = "Edit" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // ""')
else
  exit 0
fi

[ -z "$CONTENT" ] && exit 0

FINDINGS=""

# Supabase service-role / anon JWT (long, three-segment)
if echo "$CONTENT" | grep -qE 'eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}'; then
  MATCH=$(echo "$CONTENT" | grep -oE 'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}' | head -1)
  if [ ${#MATCH} -gt 80 ]; then
    FINDINGS="${FINDINGS}\n  - JWT (likely Supabase anon/service-role key)"
  fi
fi

# Supabase access token
echo "$CONTENT" | grep -qE 'sbp_[A-Za-z0-9]{30,}' && FINDINGS="${FINDINGS}\n  - Supabase access token (sbp_)"

# Resend API key
echo "$CONTENT" | grep -qE 're_[A-Za-z0-9_]{20,}' && FINDINGS="${FINDINGS}\n  - Resend API key (re_)"

# Notion integration token
echo "$CONTENT" | grep -qE 'ntn_[A-Za-z0-9]{30,}' && FINDINGS="${FINDINGS}\n  - Notion integration token (ntn_)"
echo "$CONTENT" | grep -qE 'secret_[A-Za-z0-9]{30,}' && FINDINGS="${FINDINGS}\n  - Notion secret token"

# Anthropic API key
echo "$CONTENT" | grep -qE 'sk-ant-[A-Za-z0-9_-]{20,}' && FINDINGS="${FINDINGS}\n  - Anthropic API key (sk-ant-)"

# Helicone API key (sk-helicone- prefix or similar)
echo "$CONTENT" | grep -qE 'sk-helicone-[A-Za-z0-9_-]{20,}' && FINDINGS="${FINDINGS}\n  - Helicone API key"

# Stripe secret key
echo "$CONTENT" | grep -qE 'sk_(live|test)_[A-Za-z0-9]{20,}' && FINDINGS="${FINDINGS}\n  - Stripe secret key"

# Netlify personal access token
echo "$CONTENT" | grep -qE 'nfp_[A-Za-z0-9]{30,}' && FINDINGS="${FINDINGS}\n  - Netlify PAT (nfp_)"

# GitHub token (classic + fine-grained)
echo "$CONTENT" | grep -qE '(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}' && FINDINGS="${FINDINGS}\n  - GitHub token"
echo "$CONTENT" | grep -qE 'github_pat_[A-Za-z0-9_]{50,}' && FINDINGS="${FINDINGS}\n  - GitHub fine-grained PAT"

# AWS access key
echo "$CONTENT" | grep -qE 'AKIA[0-9A-Z]{16}' && FINDINGS="${FINDINGS}\n  - AWS access key (AKIA)"

# Private key
echo "$CONTENT" | grep -qE -- '----BEGIN (RSA|EC|OPENSSH|PGP|DSA) PRIVATE KEY' && FINDINGS="${FINDINGS}\n  - Private key block"

# Google API key
echo "$CONTENT" | grep -qE 'AIza[A-Za-z0-9_-]{35}' && FINDINGS="${FINDINGS}\n  - Google API key (AIza)"

# DB connection string with embedded password
echo "$CONTENT" | grep -qE '(postgres|mysql|mongodb|redis)://[^:]+:[^@[:space:]]+@' && FINDINGS="${FINDINGS}\n  - Database URL with credentials"

# Slack token
echo "$CONTENT" | grep -qE 'xox[bpors]-[0-9a-zA-Z-]{10,}' && FINDINGS="${FINDINGS}\n  - Slack token"

if [ -n "$FINDINGS" ]; then
  BASENAME=$(basename "$FILE_PATH")
  REASON="Secret(s) detected in ${BASENAME}:${FINDINGS}\n\nUse ~/.secrets/*.env + 1Password for credentials, never source code."

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
