#!/bin/bash
# Smoke tests for .claude/hooks/{bash-leak-guard,secret-scanner}.sh.
# Run from any worktree: ./scripts/test-claude-hooks.sh

set -u

REPO="$(git rev-parse --show-toplevel)"
GUARD="$REPO/.claude/hooks/bash-leak-guard.sh"
SCANNER="$REPO/.claude/hooks/secret-scanner.sh"

PASS=0
FAIL=0

# ---- helpers ----

bash_case() {
  local label="$1" cmd="$2" expect="$3"
  local input result decision
  input=$(jq -nc --arg cmd "$cmd" '{tool_name:"Bash", tool_input:{command:$cmd}}')
  result=$(printf '%s' "$input" | "$GUARD")
  if [ -z "$result" ]; then
    decision="allow"
  else
    decision=$(printf '%s' "$result" | jq -r '.hookSpecificOutput.permissionDecision // "allow"')
  fi
  if [ "$decision" = "$expect" ]; then
    printf "  ✓ [%s] %s\n" "$decision" "$label"
    PASS=$((PASS+1))
  else
    printf "  ✗ expected=%s got=%s — %s\n" "$expect" "$decision" "$label"
    FAIL=$((FAIL+1))
  fi
}

scanner_case() {
  local label="$1" content="$2" expect="$3" path="${4:-/tmp/test.ts}"
  local input result decision
  input=$(jq -nc --arg c "$content" --arg p "$path" '{tool_name:"Write", tool_input:{file_path:$p, content:$c}}')
  result=$(printf '%s' "$input" | "$SCANNER")
  if [ -z "$result" ]; then
    decision="allow"
  else
    decision=$(printf '%s' "$result" | jq -r '.hookSpecificOutput.permissionDecision // "allow"')
  fi
  if [ "$decision" = "$expect" ]; then
    printf "  ✓ [%s] %s\n" "$decision" "$label"
    PASS=$((PASS+1))
  else
    printf "  ✗ expected=%s got=%s — %s\n" "$expect" "$decision" "$label"
    FAIL=$((FAIL+1))
  fi
}

# ---- bash-leak-guard ----

echo "=== bash-leak-guard.sh: SHOULD BLOCK ==="
bash_case "netlify env:list --plain"     "netlify env:list --plain --context production" deny
bash_case "netlify env:list --json"      "netlify env:list --json"                       deny
bash_case "cat ~/.secrets/*"             "cat ~/.secrets/anthropic.env"                  deny
bash_case "cat .env.local"               "cat .env.local"                                deny
bash_case "cat .env"                     "cat .env"                                      deny
# Widened 2026-05-04 — new SECRET_READING_TOOLS alternation
bash_case "grep ~/.secrets/*.env"        "grep TOKEN ~/.secrets/brik-packages.env"       deny
bash_case "grep glob ~/.secrets/*.env"   "grep PATTERN ~/.secrets/*.env"                 deny
bash_case "egrep on .env"                "egrep '^FOO=' .env"                            deny
bash_case "ripgrep on .env.production"   "rg SECRET .env.production"                     deny
bash_case "sed on ~/.secrets file"       "sed -n 1,5p ~/.secrets/brik-packages.env"      deny
bash_case "awk on .env.local"            "awk -F= '{print \$2}' .env.local"              deny
bash_case "jq on ~/.secrets json"        "jq .key ~/.secrets/foo.json"                   deny
bash_case "xxd on ~/.secrets file"       "xxd ~/.secrets/anthropic.env"                  deny
bash_case "strings on ~/.secrets file"   "strings ~/.secrets/anthropic.env"              deny
bash_case "head on .env"                 "head -1 .env"                                  deny
bash_case "bash -x scripts/setup.sh"     "bash -x scripts/setup.sh"                      deny
bash_case "set -x then source secrets"   "set -x; source ~/.secrets/foo.env"             deny
bash_case "bare env"                     "env | head"                                    deny
bash_case "bare printenv"                "printenv"                                      deny
bash_case "op item get --reveal bare"    "op item get foo --fields password --reveal"    deny

echo ""
echo "=== bash-leak-guard.sh: SHOULD ALLOW ==="
bash_case ".env.example"                 "cat .env.example"                              allow
bash_case ".env.sample"                  "cat .env.sample"                               allow
bash_case "printenv single"              "printenv NODE_ENV"                             allow
bash_case "env CMD form (subprocess)"    "env NODE_ENV=production npm run build"         allow
bash_case "op reveal captured"           'V=$(op item get foo --fields password --reveal)' allow
bash_case "op reveal redirected"         "op item get foo --fields password --reveal > ~/.secrets/foo.env" allow
bash_case "op reveal piped"              "op item get foo --fields password --reveal | pbcopy" allow
bash_case "netlify env:get single"       "netlify env:get NODE_ENV"                      allow
bash_case "netlify env:get redirected"   "netlify env:get NODE_ENV > /dev/null 2>&1"     allow
bash_case "npm run build"                "npm run build"                                 allow
bash_case "gh pr list"                   "gh pr list"                                    allow
bash_case "cat src file"                 "cat src/app/api/vendors/route.ts"              allow
# Allow non-secret-file uses of widened tools
bash_case "grep stdin (op pipe)"         "op item list | grep -i token"                  allow
bash_case "grep src file"                "grep TODO src/app/page.tsx"                    allow
bash_case "sed src file"                 "sed -i 's/foo/bar/' src/app/page.tsx"          allow
bash_case "jq on package.json"           "jq .version package.json"                      allow
bash_case "grep .env.example"            "grep DATABASE_URL .env.example"                allow
bash_case "grep .env.sample"             "grep API_KEY .env.sample"                      allow
# Heredoc bodies are data, not commands — commit/PR messages that document
# leak vectors must not self-block (false-positive class observed 2026-05-04).
bash_case "git commit heredoc w/ ~/.secrets prose" \
  "$(printf 'git commit -m "$(cat <<EOF\nfix: widen guard to catch grep against ~/.secrets/\nEOF\n)"')" \
  allow
bash_case "git commit heredoc w/ grep prose" \
  "$(printf 'git commit -m "$(cat <<EOF\nleaked via: grep TOKEN .env.local\nEOF\n)"')" \
  allow

# ---- secret-scanner ----

echo ""
echo "=== secret-scanner.sh: SHOULD BLOCK ==="
scanner_case "Supabase JWT (200 chars)" "const k = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5cAAAAAxxxxxxxxxxxxxxxxxxxxxx'" deny
scanner_case "Resend key"               "RESEND_API_KEY=re_AbCdEfGhIjKlMnOpQrStUv12345" deny
scanner_case "Anthropic key"            "ANTHROPIC_API_KEY=sk-ant-api03-AAAA1111BBBB2222CCCC3333DDDD4444" deny
scanner_case "GitHub PAT classic"       "TOKEN=ghp_AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKLLLL" deny
scanner_case "GitHub fine-grained PAT"  "TOKEN=github_pat_11ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghij1234567890abcdefghijkl" deny
scanner_case "AWS access key"           "AWS_KEY=AKIAIOSFODNN7EXAMPLE" deny
scanner_case "Private key"              "-----BEGIN OPENSSH PRIVATE KEY-----" deny
scanner_case "Postgres URL+pw"          "DATABASE_URL=postgres://admin:hunter2@db.example.com:5432/app" deny
scanner_case "Helicone key"             "HELICONE_API_KEY=sk-helicone-AAAABBBBCCCCDDDDEEEEFFFF" deny
scanner_case "Slack token"              "SLACK_TOKEN=xoxb-1234567890-abcdefghijklmnop" deny

echo ""
echo "=== secret-scanner.sh: SHOULD ALLOW ==="
scanner_case "re_ in comment"           "// Resend keys start with re_" allow
scanner_case ".env path skipped"        "ANTHROPIC_API_KEY=sk-ant-api03-real" allow "/tmp/foo.env"
scanner_case "regular code"             "import { NextResponse } from 'next/server'" allow
scanner_case "short JWT-shaped"         "eyJ.eyJ.short" allow

# ---- summary ----

echo ""
echo "================================="
printf "  pass=%d  fail=%d\n" "$PASS" "$FAIL"
echo "================================="
[ "$FAIL" -eq 0 ]
