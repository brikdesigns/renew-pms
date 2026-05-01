#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Auth Data Integrity Check (shared template)
# Source: brik-llm/scripts/shared/product-health/auth-health.sh
# Sync:   brik-llm/scripts/shared/product-health/sync.sh
#
# Validates the auth chain: auth.users → profiles → company/practice members
# Catches: null identities, orphaned profiles, homeless clients.
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

FAILS=0
WARNS=0
FIXES=0
CI_MODE=false
FIX_MODE=false
TARGET_ENV="staging"

for arg in "$@"; do
  case "$arg" in
    --ci)   CI_MODE=true ;;
    --fix)  FIX_MODE=true ;;
    --prod) TARGET_ENV="production" ;;
    --help|-h)
      echo "Usage: ./scripts/auth-health.sh [--ci|--fix|--prod]"
      echo ""
      echo "  (default)    Check staging auth integrity"
      echo "  --prod       Check production"
      echo "  --ci         CI mode (exit code = fail count)"
      echo "  --fix        Auto-fix recoverable issues (password reset for null identities)"
      exit 0
      ;;
  esac
done

pass()  { echo -e "  ${GREEN}[OK]${NC}    $1"; }
fail()  { echo -e "  ${RED}[FAIL]${NC}  $1"; FAILS=$((FAILS + 1)); }
warn()  { echo -e "  ${YELLOW}[WARN]${NC}  $1"; WARNS=$((WARNS + 1)); }
info()  { echo -e "  ${CYAN}[INFO]${NC}  $1"; }
dim()   { echo -e "  ${DIM}$1${NC}"; }
fixed() { echo -e "  ${GREEN}[FIX]${NC}   $1"; FIXES=$((FIXES + 1)); }

cd "$PROJECT_ROOT"

# ── Load env ──
ENV_FILE="${ENV_FILE:-.env.local}"
if [ -f "$ENV_FILE" ]; then
  set +u
  # shellcheck source=/dev/null
  source "$ENV_FILE" 2>/dev/null || true
  set -u
elif [ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]; then
  # CI: env vars already injected by GitHub Actions
  true
else
  echo -e "${RED}ERROR: $ENV_FILE not found and no env vars set${NC}"
  exit 1
fi

# ── Resolve target Supabase ──
if [ "$TARGET_ENV" = "production" ]; then
  SB_REF="${SUPABASE_PROD_REF:-}"
  if [ -z "$SB_REF" ]; then
    echo -e "${YELLOW}No production Supabase ref configured — skipping${NC}"
    exit 0
  fi
  SB_URL="${SUPABASE_PROD_URL:-https://${SB_REF}.supabase.co}"
  SB_SERVICE_KEY="${SUPABASE_PROD_SERVICE_ROLE_KEY:-${SUPABASE_SERVICE_ROLE_KEY:-}}"
  SB_ANON="${SUPABASE_PROD_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"
else
  SB_REF="${SUPABASE_STAGING_REF:-}"
  if [ -z "$SB_REF" ]; then
    SB_REF=$(echo "${NEXT_PUBLIC_SUPABASE_URL:-}" | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|')
  fi
  SB_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
  SB_SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
  SB_ANON="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"
fi

if [ -z "$SB_URL" ] || [ -z "$SB_SERVICE_KEY" ]; then
  echo -e "${RED}ERROR: Missing Supabase URL or service role key${NC}"
  exit 1
fi

# ── Helpers ──

auth_list_users() {
  local page="${1:-1}"
  curl -s "${SB_URL}/auth/v1/admin/users?page=${page}&per_page=10" \
    -H "Authorization: Bearer ${SB_SERVICE_KEY}" \
    -H "apikey: ${SB_SERVICE_KEY}"
}

auth_update_user() {
  local user_id="$1"
  local payload="$2"
  curl -s -X PUT "${SB_URL}/auth/v1/admin/users/${user_id}" \
    -H "Authorization: Bearer ${SB_SERVICE_KEY}" \
    -H "apikey: ${SB_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "$payload"
}

sb_rest() {
  local endpoint="$1"
  curl -s "${SB_URL}/rest/v1/${endpoint}" \
    -H "apikey: ${SB_ANON}" \
    -H "Authorization: Bearer ${SB_SERVICE_KEY}" \
    -H "Prefer: return=representation"
}

sb_sql() {
  local sql="$1"
  local access_token="${SUPABASE_ACCESS_TOKEN:-}"
  if [ -z "$access_token" ]; then
    echo "[]"
    return
  fi
  curl -s -X POST "https://api.supabase.com/v1/projects/${SB_REF}/database/query" \
    -H "Authorization: Bearer ${access_token}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$sql\"}"
}

echo ""
echo "========================================="
echo "  ${PROJECT_NAME:-Auth} — Auth Integrity Check"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "  Target: ${TARGET_ENV} (${SB_REF})"
echo "========================================="

# ══════════════════════════════════════════════
# 1. FETCH ALL AUTH USERS
# ══════════════════════════════════════════════

echo ""
echo "── Fetching auth.users ──"

# Paginate through all auth users (small page size for compatibility)
ALL_USERS_JSON="[]"
PAGE=1
while true; do
  PAGE_JSON=$(auth_list_users "$PAGE")

  # Validate response
  PAGE_RESULT=$(echo "$PAGE_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, dict) and 'users' in data and isinstance(data['users'], list):
    print(len(data['users']))
else:
    print('error')
" 2>/dev/null || echo "error")

  if [ "$PAGE_RESULT" = "error" ]; then
    if [ "$PAGE" -eq 1 ]; then
      # Retry once on first page
      sleep 2
      PAGE_JSON=$(auth_list_users 1)
      PAGE_RESULT=$(echo "$PAGE_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, dict) and 'users' in data and isinstance(data['users'], list):
    print(len(data['users']))
else:
    print('error')
" 2>/dev/null || echo "error")
      if [ "$PAGE_RESULT" = "error" ]; then
        fail "Could not fetch auth users (check service role key)"
        dim "  Response: $(echo "$PAGE_JSON" | head -c 200)"
        echo ""
        exit 1
      fi
    else
      break
    fi
  fi

  # Merge users into accumulated array
  ALL_USERS_JSON=$(python3 -c "
import json, sys
existing = json.loads(sys.argv[1])
page_data = json.loads(sys.argv[2])
existing.extend(page_data.get('users', []))
print(json.dumps(existing))
" "$ALL_USERS_JSON" "$PAGE_JSON" 2>/dev/null || echo "$ALL_USERS_JSON")

  # Stop if we got fewer users than page size (last page)
  if [ "$PAGE_RESULT" -lt 10 ]; then
    break
  fi

  PAGE=$((PAGE + 1))
  # Safety: max 20 pages (200 users)
  if [ "$PAGE" -gt 20 ]; then
    break
  fi
done

# Wrap in the expected format for downstream checks
AUTH_USERS_JSON="{\"users\": $ALL_USERS_JSON}"

USER_COUNT=$(echo "$AUTH_USERS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(len(data.get('users', [])))
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" -eq 0 ]; then
  fail "Could not fetch auth users (check service role key)"
  echo ""
  exit 1
fi

info "$USER_COUNT auth users found"

# ══════════════════════════════════════════════
# 2. NULL IDENTITIES
#    Uses Management API SQL because the list endpoint omits identities.
# ══════════════════════════════════════════════

echo ""
echo "── Identity Records ──"

NULL_IDENTITIES=$(sb_sql "
  SELECT u.id, u.email, u.created_at::text
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
  )
  ORDER BY u.email
" 2>/dev/null | python3 -c "
import sys, json
rows = json.load(sys.stdin)
if isinstance(rows, list):
    for r in rows:
        print(f\"{r['email']}|{r['id']}|{r['created_at']}\")
" 2>/dev/null)

if [ -z "$NULL_IDENTITIES" ]; then
  pass "All auth users have identity records"
else
  NULL_COUNT=$(echo "$NULL_IDENTITIES" | wc -l | tr -d ' ')
  fail "$NULL_COUNT user(s) with null/empty identities (cannot sign in with email+password)"

  while IFS='|' read -r email uid created; do
    dim "  $email (created $created)"

    if [ "$FIX_MODE" = true ]; then
      RESULT=$(auth_update_user "$uid" '{"password": "TempFix_'"$(date +%s)"'!"}')
      RESULT=$(auth_update_user "$uid" '{"password": "TestUser123!"}')

      if echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('id')" 2>/dev/null; then
        fixed "Repaired identities for $email (password reset to TestUser123!)"
      else
        warn "Could not auto-fix $email — manual intervention needed"
      fi
    fi
  done <<< "$NULL_IDENTITIES"

  if [ "$FIX_MODE" = false ]; then
    dim "  Run with --fix to auto-repair (resets password to TestUser123!)"
  fi
fi

# ══════════════════════════════════════════════
# 3. UNCONFIRMED EMAILS
# ══════════════════════════════════════════════

echo ""
echo "── Email Confirmation ──"

UNCONFIRMED=$(echo "$AUTH_USERS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
users = data.get('users', data) if isinstance(data, dict) else data
for u in users:
    if not u.get('email_confirmed_at'):
        print(f\"{u['email']}|{u['id']}|{u.get('created_at','?')}\")
" 2>/dev/null)

if [ -z "$UNCONFIRMED" ]; then
  pass "All auth users have confirmed emails"
else
  UNCONF_COUNT=$(echo "$UNCONFIRMED" | wc -l | tr -d ' ')
  warn "$UNCONF_COUNT user(s) with unconfirmed email (may not be able to sign in)"
  while IFS='|' read -r email uid created; do
    dim "  $email (created $created)"
  done <<< "$UNCONFIRMED"
fi

# ══════════════════════════════════════════════
# 4. AUTH USERS WITHOUT PROFILES
# ══════════════════════════════════════════════

echo ""
echo "── auth.users → ${ADMIN_TABLE:-profiles} ──"

PROFILE_TABLE="${ADMIN_TABLE:-profiles}"

MISSING_PROFILES=$(echo "$AUTH_USERS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
users = data.get('users', data) if isinstance(data, dict) else data
for u in users:
    print(f\"{u['id']}|{u['email']}\")
" 2>/dev/null)

ALL_PROFILE_IDS=$(sb_rest "${PROFILE_TABLE}?select=id" | python3 -c "
import sys, json
for p in json.load(sys.stdin):
    print(p['id'])
" 2>/dev/null)

MISSING_PROFILE_LIST=""
# Bash substring match instead of `echo "$IDS" | grep -q` — `set -o pipefail`
# combined with grep -q's early exit causes echo to SIGPIPE, making the
# pipeline return non-zero and falsely flagging FOUND users as missing.
# Newline-padding both sides prevents UUID-substring false matches.
while IFS='|' read -r uid email; do
  if [[ $'\n'"$ALL_PROFILE_IDS"$'\n' != *$'\n'"$uid"$'\n'* ]]; then
    MISSING_PROFILE_LIST="${MISSING_PROFILE_LIST}${email} (${uid})\n"
  fi
done <<< "$MISSING_PROFILES"

if [ -z "$MISSING_PROFILE_LIST" ]; then
  pass "All auth users have a ${PROFILE_TABLE} record"
else
  MISSING_P_COUNT=$(echo -e "$MISSING_PROFILE_LIST" | grep -c '.' || echo "0")
  fail "$MISSING_P_COUNT auth user(s) without a ${PROFILE_TABLE} record"
  echo -e "$MISSING_PROFILE_LIST" | while read -r line; do
    [ -n "$line" ] && dim "  $line"
  done
fi

# ══════════════════════════════════════════════
# 5. PROFILES WITHOUT AUTH USERS (orphaned)
# ══════════════════════════════════════════════

echo ""
echo "── ${PROFILE_TABLE} → auth.users ──"

ALL_AUTH_IDS=$(echo "$AUTH_USERS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
users = data.get('users', data) if isinstance(data, dict) else data
for u in users:
    print(u['id'])
" 2>/dev/null)

ALL_PROFILES=$(sb_rest "${PROFILE_TABLE}?select=id,email" | python3 -c "
import sys, json
for p in json.load(sys.stdin):
    print(f\"{p['id']}|{p.get('email','?')}\")
" 2>/dev/null)

ORPHANED_PROFILES=""
# Same pipefail+SIGPIPE bug as section 4 — see comment there.
while IFS='|' read -r pid pemail; do
  if [[ $'\n'"$ALL_AUTH_IDS"$'\n' != *$'\n'"$pid"$'\n'* ]]; then
    ORPHANED_PROFILES="${ORPHANED_PROFILES}${pemail} (${pid})\n"
  fi
done <<< "$ALL_PROFILES"

if [ -z "$ORPHANED_PROFILES" ]; then
  pass "No orphaned ${PROFILE_TABLE} (all reference valid auth.users)"
else
  ORPHAN_COUNT=$(echo -e "$ORPHANED_PROFILES" | grep -c '.' || echo "0")
  warn "$ORPHAN_COUNT orphaned ${PROFILE_TABLE} record(s) without auth.users"
  echo -e "$ORPHANED_PROFILES" | while read -r line; do
    [ -n "$line" ] && dim "  $line"
  done
fi

# ══════════════════════════════════════════════
# 6. LOGIN SMOKE TEST
# ══════════════════════════════════════════════

echo ""
echo "── Login Smoke Test ──"

SMOKE_EMAIL="${ADMIN_SMOKE_EMAIL:-}"
if [ -z "$SMOKE_EMAIL" ]; then
  # Try to find an admin email from profiles
  SMOKE_EMAIL=$(sb_rest "${PROFILE_TABLE}?select=email&role=eq.${ADMIN_ROLE:-super_admin}&limit=1" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data[0]['email'] if data else '')
" 2>/dev/null || echo "")
fi

if [ -n "$SMOKE_EMAIL" ]; then
  SMOKE_RESULT=$(curl -s -X POST "${SB_URL}/auth/v1/token?grant_type=password" \
    -H "apikey: ${SB_ANON}" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"${SMOKE_EMAIL}\", \"password\": \"TestUser123!\"}" 2>/dev/null)

  SMOKE_OK=$(echo "$SMOKE_RESULT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('yes' if d.get('access_token') else 'no')
" 2>/dev/null || echo "no")

  if [ "$SMOKE_OK" = "yes" ]; then
    pass "Admin login works (${SMOKE_EMAIL})"
  else
    warn "Admin login with test password failed for ${SMOKE_EMAIL}"
    dim "  This is expected if using a non-test password"
  fi
else
  info "No admin email found — skipping login smoke test"
fi

# ══════════════════════════════════════════════
# 7. STALE USERS (no login in 30+ days)
# ══════════════════════════════════════════════

echo ""
echo "── Stale Users (no login in 30+ days) ──"

STALE_USERS=$(echo "$AUTH_USERS_JSON" | python3 -c "
import sys, json
from datetime import datetime, timezone, timedelta
data = json.load(sys.stdin)
users = data.get('users', data) if isinstance(data, dict) else data
cutoff = datetime.now(timezone.utc) - timedelta(days=30)
stale = []
for u in users:
    last = u.get('last_sign_in_at')
    if last:
        try:
            dt = datetime.fromisoformat(last.replace('Z', '+00:00'))
            if dt < cutoff:
                stale.append(f\"{u['email']} (last: {last[:10]})\")
        except:
            pass
    else:
        created = u.get('created_at', '?')[:10]
        stale.append(f\"{u['email']} (never logged in, created {created})\")
for s in stale:
    print(s)
" 2>/dev/null)

if [ -z "$STALE_USERS" ]; then
  pass "All users have recent login activity"
else
  STALE_COUNT=$(echo "$STALE_USERS" | wc -l | tr -d ' ')
  info "$STALE_COUNT user(s) with no login in 30+ days"
  while read -r line; do
    [ -n "$line" ] && dim "  $line"
  done <<< "$STALE_USERS"
fi

# ══════════════════════════════════════════════
# 8. PROJECT-SPECIFIC EXTENSION
# ══════════════════════════════════════════════

if [ -f "$SCRIPT_DIR/auth-health-custom.sh" ]; then
  echo ""
  echo "── Project-Specific Checks ──"
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/auth-health-custom.sh"
fi

# ══════════════════════════════════════════════
# Summary
# ══════════════════════════════════════════════
echo ""
echo "========================================="
if [ "$FAILS" -eq 0 ] && [ "$WARNS" -eq 0 ]; then
  echo -e "  ${GREEN}✓ Auth integrity checks passed${NC}"
elif [ "$FAILS" -eq 0 ]; then
  echo -e "  ${YELLOW}$WARNS warning(s), 0 failures${NC}"
else
  echo -e "  ${RED}$FAILS failure(s), $WARNS warning(s)${NC}"
fi

if [ "$FIXES" -gt 0 ]; then
  echo -e "  ${GREEN}$FIXES issue(s) auto-fixed${NC}"
fi

echo "========================================="
echo ""

if [ "$CI_MODE" = true ]; then
  exit "$FAILS"
fi
