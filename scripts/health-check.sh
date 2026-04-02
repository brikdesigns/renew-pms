#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Product Health Check (shared template)
# Source: brik-llm/scripts/shared/product-health/health-check.sh
# Sync:   brik-llm/scripts/shared/product-health/sync.sh
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

# ── Validate required config ──
for var in PROJECT_NAME GITHUB_REPO; do
  if [ -z "${!var:-}" ]; then
    echo "ERROR: $var not set in project.env"
    exit 1
  fi
done

# ── CLI flags ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

FAILS=0
WARNS=0
CI_MODE=false
QUICK=false

for arg in "$@"; do
  case "$arg" in
    --ci)    CI_MODE=true ;;
    --quick) QUICK=true ;;
    --help|-h)
      echo "Usage: ./scripts/health-check.sh [--ci|--quick]"
      echo ""
      echo "  (default)    Full interactive health check"
      echo "  --ci         CI mode (non-interactive, exit code = fail count)"
      echo "  --quick      Skip build check and Netlify API calls"
      exit 0
      ;;
  esac
done

pass()  { echo -e "  ${GREEN}[OK]${NC}    $1"; }
fail()  { echo -e "  ${RED}[FAIL]${NC}  $1"; FAILS=$((FAILS + 1)); }
warn()  { echo -e "  ${YELLOW}[WARN]${NC}  $1"; WARNS=$((WARNS + 1)); }
info()  { echo -e "  ${CYAN}[INFO]${NC}  $1"; }
dim()   { echo -e "  ${DIM}$1${NC}"; }

cd "$PROJECT_ROOT"

echo ""
echo "========================================="
echo "  ${PROJECT_NAME} — Health Check"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "========================================="

# ── 1. Local environment ──
echo ""
echo "── Local Environment ──"

ENV_FILE="${ENV_FILE:-.env.local}"
if [ -f "$ENV_FILE" ]; then
  pass "$ENV_FILE exists"
else
  fail "$ENV_FILE missing — app won't start"
fi

# Check required env vars
IFS=' ' read -ra REQ_VARS <<< "${REQUIRED_ENV_VARS:-}"
for var in "${REQ_VARS[@]}"; do
  [ -z "$var" ] && continue
  if grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
    pass "$var set"
  else
    fail "$var missing from $ENV_FILE"
  fi
done

# Check optional env vars
IFS=' ' read -ra OPT_VARS <<< "${OPTIONAL_ENV_VARS:-}"
for var in "${OPT_VARS[@]}"; do
  [ -z "$var" ] && continue
  if grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
    pass "$var set"
  else
    warn "$var not in $ENV_FILE (optional)"
  fi
done

# ── 2. Supabase connectivity ──
if [ -n "${SUPABASE_PROD_REF:-}" ]; then
  echo ""
  echo "── Supabase Production ──"

  if [ -f "$ENV_FILE" ]; then
    # shellcheck source=/dev/null
    source "$ENV_FILE" 2>/dev/null || true

    PROD_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://${SUPABASE_PROD_REF}.supabase.co}"

    PROD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
      "${PROD_URL}/rest/v1/${HEALTH_CHECK_TABLE:-profiles}?select=id&limit=1" \
      -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY:-}" 2>/dev/null || echo "000")

    if [ "$PROD_STATUS" = "200" ]; then
      pass "REST API responding (HTTP $PROD_STATUS)"
    else
      fail "REST API unreachable (HTTP $PROD_STATUS)"
    fi

    # Check admin user if configured
    if [ -n "${ADMIN_USER_ID:-}" ] && [ -n "${ADMIN_ROLE:-}" ]; then
      ADMIN_CHECK=$(curl -s \
        "${PROD_URL}/rest/v1/${ADMIN_TABLE:-profiles}?id=eq.${ADMIN_USER_ID}&select=role" \
        -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY:-}" 2>/dev/null)

      if echo "$ADMIN_CHECK" | grep -q "\"${ADMIN_ROLE}\""; then
        pass "Admin user exists with ${ADMIN_ROLE} role"
      else
        fail "Admin user missing or wrong role (expected ${ADMIN_ROLE})"
      fi
    fi
  fi
fi

if [ -n "${SUPABASE_STAGING_REF:-}" ]; then
  echo ""
  echo "── Supabase Staging ──"

  STG_URL="https://${SUPABASE_STAGING_REF}.supabase.co"
  STG_PING=$(curl -s -o /dev/null -w "%{http_code}" "${STG_URL}" 2>/dev/null || echo "000")
  if [ "$STG_PING" != "000" ]; then
    pass "Staging project reachable ($STG_URL)"
  else
    fail "Staging project unreachable ($STG_URL)"
  fi
fi

# ── 3. Management API ──
if [ -n "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo ""
  echo "── Management API (migration path) ──"

  for ENV_PAIR in ${SUPABASE_ENVS:-"production:${SUPABASE_PROD_REF:-} staging:${SUPABASE_STAGING_REF:-}"}; do
    ELABEL="${ENV_PAIR%%:*}"
    EREF="${ENV_PAIR#*:}"
    [ -z "$EREF" ] && continue

    API_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
      "https://api.supabase.com/v1/projects/${EREF}/database/query" \
      -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"query": "SELECT 1 AS ok"}' 2>/dev/null || echo "000")

    if [ "$API_TEST" = "200" ] || [ "$API_TEST" = "201" ]; then
      pass "Management API ($ELABEL) — OK"
    else
      fail "Management API ($ELABEL) — HTTP $API_TEST (migrations will fail!)"
    fi
  done
else
  warn "SUPABASE_ACCESS_TOKEN not set — skipping Management API check"
fi

# ── 4. GitHub secrets ──
echo ""
echo "── GitHub Secrets ──"

if command -v gh &> /dev/null && [ -n "${GITHUB_REPO:-}" ]; then
  SECRETS=$(gh secret list --repo "$GITHUB_REPO" 2>/dev/null || echo "")

  IFS=' ' read -ra REQ_SECRETS <<< "${REQUIRED_GITHUB_SECRETS:-}"
  for secret in "${REQ_SECRETS[@]}"; do
    [ -z "$secret" ] && continue
    if echo "$SECRETS" | grep -q "^$secret"; then
      UPDATED=$(echo "$SECRETS" | grep "^$secret" | awk '{print $2}')
      pass "$secret (updated $UPDATED) [REQUIRED]"
    else
      fail "$secret missing — CI will fail!"
    fi
  done

  IFS=' ' read -ra OPT_SECRETS <<< "${OPTIONAL_GITHUB_SECRETS:-}"
  for secret in "${OPT_SECRETS[@]}"; do
    [ -z "$secret" ] && continue
    if echo "$SECRETS" | grep -q "^$secret"; then
      UPDATED=$(echo "$SECRETS" | grep "^$secret" | awk '{print $2}')
      pass "$secret (updated $UPDATED)"
    else
      warn "$secret missing (optional)"
    fi
  done
else
  warn "gh CLI not available or GITHUB_REPO not set — skipping"
fi

# ── 5. Netlify ──
if [ "$QUICK" = false ] && [ -n "${NETLIFY_SITE_ID:-}" ]; then
  echo ""
  echo "── Netlify Environment ──"

  NETLIFY_TOKEN="${NETLIFY_ACCESS_TOKEN:-}"
  NETLIFY_ACCOUNT="${NETLIFY_ACCOUNT:-brikdesigns}"

  if [ -n "$NETLIFY_TOKEN" ]; then
    NETLIFY_ENVS=$(curl -s "https://api.netlify.com/api/v1/accounts/${NETLIFY_ACCOUNT}/env?site_id=${NETLIFY_SITE_ID}" \
      -H "Authorization: Bearer $NETLIFY_TOKEN" 2>/dev/null)

    IFS=' ' read -ra SCOPED_VARS <<< "${NETLIFY_STAGING_SCOPED_VARS:-NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY}"
    for var in "${SCOPED_VARS[@]}"; do
      [ -z "$var" ] && continue
      HAS_STAGING=$(echo "$NETLIFY_ENVS" | python3 -c "
import sys, json
envs = json.load(sys.stdin)
for e in envs:
    if e['key'] == '$var':
        for v in e.get('values', []):
            if v.get('context_parameter') == 'staging':
                print('yes')
                break
" 2>/dev/null || echo "")

      if [ "$HAS_STAGING" = "yes" ]; then
        pass "$var has staging branch scope"
      else
        fail "$var missing staging branch scope — staging will use prod DB!"
      fi
    done
  else
    warn "NETLIFY_ACCESS_TOKEN not set — skipping Netlify check"
  fi
fi

# ── 6. CI status ──
if [ -n "${CI_WORKFLOW:-}" ]; then
  echo ""
  echo "── CI Pipeline ──"

  if command -v gh &> /dev/null; then
    LAST_RUN=$(gh run list --repo "$GITHUB_REPO" --workflow="$CI_WORKFLOW" --limit=1 --json conclusion,headBranch,createdAt 2>/dev/null || echo "[]")
    CONCLUSION=$(echo "$LAST_RUN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['conclusion'] if d else 'unknown')" 2>/dev/null || echo "unknown")
    BRANCH=$(echo "$LAST_RUN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['headBranch'] if d else '?')" 2>/dev/null || echo "?")
    WHEN=$(echo "$LAST_RUN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['createdAt'][:10] if d else '?')" 2>/dev/null || echo "?")

    if [ "$CONCLUSION" = "success" ]; then
      pass "Last CI ($CI_WORKFLOW): success ($BRANCH, $WHEN)"
    elif [ "$CONCLUSION" = "failure" ]; then
      fail "Last CI ($CI_WORKFLOW): FAILED ($BRANCH, $WHEN)"
    else
      warn "Last CI ($CI_WORKFLOW): $CONCLUSION ($BRANCH, $WHEN)"
    fi
  fi
fi

# ── 7. Build check ──
if [ "$QUICK" = false ]; then
  echo ""
  echo "── Build ──"

  BUILD_CMD="${BUILD_CMD:-npm run build}"
  if eval "$BUILD_CMD" > /tmp/product-build.log 2>&1; then
    pass "Production build passes"
  else
    fail "Build failed — check /tmp/product-build.log"
  fi
fi

# ── 8. Git hygiene ──
echo ""
echo "── Git Hygiene ──"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
info "Current branch: $CURRENT_BRANCH"

MAIN_BRANCH="${MAIN_BRANCH:-main}"
STAGING_BRANCH="${STAGING_BRANCH:-staging}"

# Unpushed commits
UPSTREAM=$(git rev-parse --abbrev-ref "@{upstream}" 2>/dev/null || echo "")
if [ -n "$UPSTREAM" ]; then
  UNPUSHED=$(git rev-list "$UPSTREAM"..HEAD --count 2>/dev/null || echo "0")
  if [ "$UNPUSHED" -eq 0 ]; then
    pass "No unpushed commits"
  elif [ "$UNPUSHED" -le 3 ]; then
    warn "$UNPUSHED unpushed commit(s) — push when ready"
  else
    fail "$UNPUSHED unpushed commits — push soon to avoid losing work"
  fi
else
  warn "No upstream tracking branch set"
fi

# Uncommitted changes
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  DIRTY_COUNT=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  warn "$DIRTY_COUNT uncommitted change(s) in working tree"
else
  pass "Working tree clean"
fi

# Staging vs main divergence
if git rev-parse "origin/$MAIN_BRANCH" &>/dev/null && git rev-parse "origin/$STAGING_BRANCH" &>/dev/null; then
  AHEAD=$(git rev-list "origin/$MAIN_BRANCH".."origin/$STAGING_BRANCH" --count 2>/dev/null || echo "0")
  if [ "$AHEAD" -eq 0 ]; then
    pass "$STAGING_BRANCH is up-to-date with $MAIN_BRANCH"
  elif [ "$AHEAD" -le 10 ]; then
    info "$STAGING_BRANCH is $AHEAD commit(s) ahead of $MAIN_BRANCH"
  elif [ "$AHEAD" -le 25 ]; then
    warn "$STAGING_BRANCH is $AHEAD commits ahead of $MAIN_BRANCH — consider merging"
  else
    fail "$STAGING_BRANCH is $AHEAD commits ahead of $MAIN_BRANCH — merge overdue"
  fi
fi

# Prune stale refs
PRUNED=$(git fetch --prune origin 2>&1 | grep '\[deleted\]' | wc -l | tr -d ' ')
if [ "$PRUNED" -gt 0 ]; then
  info "Pruned $PRUNED stale remote ref(s)"
else
  pass "No stale remote refs"
fi

# Stale merged branches
STALE_BRANCHES=$(git branch -r --merged "origin/$MAIN_BRANCH" 2>/dev/null \
  | grep -v "origin/$MAIN_BRANCH$" \
  | grep -v "origin/$STAGING_BRANCH$" \
  | grep -v 'origin/HEAD' \
  | wc -l | tr -d ' ')
if [ "$STALE_BRANCHES" -gt 0 ]; then
  warn "$STALE_BRANCHES merged remote branch(es) could be deleted"
  git branch -r --merged "origin/$MAIN_BRANCH" 2>/dev/null \
    | grep -v "origin/$MAIN_BRANCH$" \
    | grep -v "origin/$STAGING_BRANCH$" \
    | grep -v 'origin/HEAD' \
    | head -5 | while read -r b; do echo "       $b"; done
else
  pass "No stale merged branches"
fi

# ── 9. Security audit ──
echo ""
echo "── Security Audit ──"

AUDIT_OUTPUT=$(npm audit --json 2>/dev/null; true)
VULN_TOTAL=$(echo "$AUDIT_OUTPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    meta = d.get('metadata', {}).get('vulnerabilities', {})
    print(meta.get('high', 0) + meta.get('critical', 0))
except:
    print(-1)
" 2>/dev/null || echo "-1")

if [ "$VULN_TOTAL" -eq 0 ]; then
  pass "No high/critical vulnerabilities"
elif [ "$VULN_TOTAL" -gt 0 ]; then
  warn "$VULN_TOTAL high/critical vulnerability(ies)"
else
  warn "Could not parse npm audit output"
fi

# ── 10. Migration sync ──
MIGRATION_DIR="${MIGRATION_DIR:-supabase/migrations}"
if [ -d "$MIGRATION_DIR" ]; then
  echo ""
  echo "── Migration Sync ──"

  LOCAL_COUNT=$(find "$MIGRATION_DIR" -name '*.sql' -maxdepth 1 2>/dev/null | wc -l | tr -d ' ')
  info "$LOCAL_COUNT migration files in $MIGRATION_DIR/"

  # Check if CI workflow has APPLIED_MIGRATIONS list
  if [ -n "${CI_WORKFLOW:-}" ] && [ -f ".github/workflows/$CI_WORKFLOW" ]; then
    APPLIED_COUNT=$(grep -oE '000[0-9]{2}' ".github/workflows/$CI_WORKFLOW" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$APPLIED_COUNT" = "$LOCAL_COUNT" ]; then
      pass "APPLIED_MIGRATIONS matches migration count ($APPLIED_COUNT)"
    else
      warn "APPLIED_MIGRATIONS has $APPLIED_COUNT entries but $LOCAL_COUNT migrations exist"
      dim "New migrations auto-apply via CI — only an issue if applied manually"
    fi
  fi
fi

# ── 11. Custom checks (project-specific) ──
CUSTOM_CHECKS="$SCRIPT_DIR/health-check-custom.sh"
if [ -f "$CUSTOM_CHECKS" ]; then
  echo ""
  echo "── Project-Specific Checks ──"
  # shellcheck source=/dev/null
  source "$CUSTOM_CHECKS"
fi

# ── Summary ──
echo ""
echo "========================================="
if [ "$FAILS" -eq 0 ] && [ "$WARNS" -eq 0 ]; then
  echo -e "  ${GREEN}All checks passed${NC}"
elif [ "$FAILS" -eq 0 ]; then
  echo -e "  ${YELLOW}$WARNS warning(s), 0 failures${NC}"
else
  echo -e "  ${RED}$FAILS failure(s), $WARNS warning(s)${NC}"
fi
echo "========================================="
echo ""

if [ "$CI_MODE" = true ]; then
  exit "$FAILS"
fi
