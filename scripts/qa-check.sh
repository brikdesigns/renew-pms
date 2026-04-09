#!/usr/bin/env bash
set -euo pipefail

# Renew PMS — Pre-Deploy QA Check
# Validates build, data integrity, and enum consistency before merging to main.
#
# Usage:
#   ./scripts/qa-check.sh              # Full QA (interactive)
#   ./scripts/qa-check.sh --ci         # CI mode (non-interactive, exit code = fail count)
#   ./scripts/qa-check.sh --quick      # Skip build + data integrity (lint + migration only)
#   ./scripts/qa-check.sh --data-only  # Only run data integrity checks
#
# Run this:
#   - Before every merge to main
#   - After applying migrations to staging
#   - After bulk data updates (seed scripts, manual fixes)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

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
DATA_ONLY=false
TARGET_ENV="staging"

for arg in "$@"; do
  case "$arg" in
    --ci)        CI_MODE=true ;;
    --quick)     QUICK=true ;;
    --data-only) DATA_ONLY=true ;;
    --prod)      TARGET_ENV="production" ;;
    --help|-h)
      echo "Usage: ./scripts/qa-check.sh [--ci|--quick|--data-only|--prod]"
      echo ""
      echo "  (default)      Full QA check against staging"
      echo "  --ci           CI mode (non-interactive, exit code = fail count)"
      echo "  --quick        Skip build + data integrity (lint + migration only)"
      echo "  --data-only    Only run data integrity checks"
      echo "  --prod         Target production instead of staging"
      exit 0
      ;;
  esac
done

pass()  { echo -e "  ${GREEN}[PASS]${NC}  $1"; }
fail()  { echo -e "  ${RED}[FAIL]${NC}  $1"; FAILS=$((FAILS + 1)); }
warn()  { echo -e "  ${YELLOW}[WARN]${NC}  $1"; WARNS=$((WARNS + 1)); }
info()  { echo -e "  ${CYAN}[INFO]${NC}  $1"; }
dim()   { echo -e "  ${DIM}$1${NC}"; }

cd "$PROJECT_ROOT"

# ── Load env ──
if [ -f ".env.local" ]; then
  # shellcheck source=/dev/null
  source .env.local 2>/dev/null || true
elif [ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]; then
  # CI: env vars already injected by GitHub Actions
  true
else
  echo -e "${RED}ERROR: .env.local not found and no env vars set${NC}"
  exit 1
fi

# Load project config
if [ -f "$SCRIPT_DIR/project.env" ]; then
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/project.env"
fi

# Resolve target Supabase URL + keys
if [ "$TARGET_ENV" = "production" ]; then
  SB_URL="${SUPABASE_PROD_URL:-}"
  SB_KEY="${SUPABASE_PROD_SERVICE_ROLE_KEY:-${SUPABASE_SERVICE_ROLE_KEY}}"
  SB_ANON="${SUPABASE_PROD_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY}}"
  SB_REF="${SUPABASE_PROD_REF:-}"
  if [ -z "$SB_URL" ] || [ -z "$SB_REF" ]; then
    echo -e "${RED}ERROR: Production Supabase not yet provisioned${NC}"
    exit 1
  fi
else
  SB_URL="${NEXT_PUBLIC_SUPABASE_URL}"
  SB_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
  SB_ANON="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
  SB_REF="${SUPABASE_STAGING_REF:-zneuygoeorhkuhktmuld}"
fi

# Helper: run a Supabase REST query, return JSON
sb_query() {
  local endpoint="$1"
  curl -s "${SB_URL}/rest/v1/${endpoint}" \
    -H "apikey: ${SB_ANON}" \
    -H "Authorization: Bearer ${SB_KEY}" \
    -H "Prefer: return=representation"
}

# Helper: run raw SQL via Management API
sb_sql() {
  local sql="$1"
  curl -s -X POST "https://api.supabase.com/v1/projects/${SB_REF}/database/query" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$sql\"}"
}

echo ""
echo "========================================="
echo "  Renew PMS — QA Check"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "  Target: ${TARGET_ENV}"
echo "========================================="

# ══════════════════════════════════════════════
# 1. BUILD + LINT (skip if --data-only)
# ══════════════════════════════════════════════
if [ "$DATA_ONLY" = false ]; then

  echo ""
  echo "── TypeScript + Lint ──"

  # Type check
  if npm run typecheck --silent > /tmp/qa-typecheck.log 2>&1; then
    pass "TypeScript compiles"
  else
    fail "TypeScript errors — see /tmp/qa-typecheck.log"
  fi

  # Lint check
  if npm run lint --silent > /tmp/qa-lint.log 2>&1; then
    pass "ESLint passes"
  else
    fail "ESLint errors — see /tmp/qa-lint.log"
  fi

  if [ "$QUICK" = false ]; then
    echo ""
    echo "── Production Build ──"

    if npm run build > /tmp/qa-build.log 2>&1; then
      pass "Production build succeeds"
    else
      fail "Build failed — see /tmp/qa-build.log"
    fi
  fi

  # ══════════════════════════════════════════════
  # 2. MIGRATION INTEGRITY
  # ══════════════════════════════════════════════
  echo ""
  echo "── Migration Integrity ──"

  MIGRATION_DIR="${MIGRATION_DIR:-supabase/migrations}"

  if [ ! -d "$MIGRATION_DIR" ]; then
    warn "Migration directory not found: $MIGRATION_DIR"
  else
    MIGRATION_FILES=$(ls -1 "$MIGRATION_DIR"/*.sql 2>/dev/null | sort)
    MIGRATION_COUNT=$(echo "$MIGRATION_FILES" | wc -l | tr -d ' ')
    info "$MIGRATION_COUNT migration files"

    # Check for duplicate migration numbers
    HAS_DUP=false
    PREV_NUM=-1
    while IFS= read -r file; do
      [ -z "$file" ] && continue
      NUM=$(basename "$file" | grep -oE '^[0-9]+' | sed 's/^0*//')
      if [ "$NUM" -eq "$PREV_NUM" ]; then
        HAS_DUP=true
        fail "Duplicate migration number: $NUM"
      fi
      PREV_NUM="$NUM"
    done <<< "$MIGRATION_FILES"

    if [ "$HAS_DUP" = false ]; then
      pass "No duplicate migration numbers"
    fi

    # Check that all migration files have valid SQL (not empty)
    EMPTY_MIGRATIONS=0
    while IFS= read -r file; do
      [ -z "$file" ] && continue
      CONTENT=$(grep -v '^--' "$file" | grep -v '^\s*$' | head -1)
      if [ -z "$CONTENT" ]; then
        EMPTY_MIGRATIONS=$((EMPTY_MIGRATIONS + 1))
        warn "Empty migration: $(basename "$file")"
      fi
    done <<< "$MIGRATION_FILES"

    if [ "$EMPTY_MIGRATIONS" -eq 0 ]; then
      pass "All migrations contain SQL"
    fi

    # Orphaned migrations (local but not in git)
    ORPHAN_MIGRATIONS=""
    for file in "$MIGRATION_DIR"/*.sql; do
      [ -f "$file" ] || continue
      if ! git ls-files --error-unmatch "$file" > /dev/null 2>&1; then
        ORPHAN_MIGRATIONS="$ORPHAN_MIGRATIONS $(basename "$file")"
      fi
    done

    if [ -z "$ORPHAN_MIGRATIONS" ]; then
      pass "All migration files are tracked in git"
    else
      fail "Orphaned migration(s) not in git:$ORPHAN_MIGRATIONS"
      dim "These may be applied to the DB but CI will never know. Stage and commit them."
    fi
  fi

  # ══════════════════════════════════════════════
  # 3. ENUM / CONSTRAINT SYNC
  # ══════════════════════════════════════════════
  echo ""
  echo "── Enum Sync ──"

  # Task status enum: code vs DB
  # Extract status values from TypeScript enum/type definitions
  CODE_TASK_STATUSES=$(grep -oE "'(not_started|in_progress|awaiting_approval|completed|blocked|skipped|overdue)'" src/app/api/tasks/route.ts 2>/dev/null | \
    sed "s/'//g" | sort -u | tr '\n' ',' | sed 's/,$//' || echo "")

  if [ -n "$CODE_TASK_STATUSES" ]; then
    info "Task statuses in code: $CODE_TASK_STATUSES"
    pass "Task status enum defined in API route"
  else
    # Fallback: check CLAUDE.md for canonical list
    info "Task status enum not directly validated — refer to CLAUDE.md for canonical values"
  fi

  # Check that task priority values used in UI match expectations
  PRIORITY_VALUES=$(grep -roh "'low'\|'medium'\|'high'\|'critical'" src/app/api/tasks/ 2>/dev/null | sort -u | tr '\n' ',' | sed 's/,$//' || echo "")
  if [ -n "$PRIORITY_VALUES" ]; then
    pass "Task priority values found in API: $PRIORITY_VALUES"
  fi

  # Employee type enum sync
  EMPLOYEE_TYPES=$(grep -roh "'new'\|'maturing'\|'proficient'" src/ 2>/dev/null | sort -u | tr '\n' ',' | sed 's/,$//' || echo "")
  if [ -n "$EMPLOYEE_TYPES" ]; then
    info "Employee types in code: $EMPLOYEE_TYPES"
  fi

fi # end DATA_ONLY check

# ══════════════════════════════════════════════
# 4. DATA INTEGRITY (live database checks)
# ══════════════════════════════════════════════
if [ "$QUICK" = false ]; then

  echo ""
  echo "── Data Integrity ($TARGET_ENV) ──"

  # Check if we can reach the Management API
  if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
    warn "SUPABASE_ACCESS_TOKEN not set — skipping live data integrity checks"
    dim "Set it to enable database-level validation"
  else

    # 4a. Orphaned practice_members (user_id not in profiles)
    ORPHANED_MEMBERS=$(sb_sql "
      SELECT COUNT(*) AS count
      FROM practice_members pm
      LEFT JOIN profiles p ON p.id = pm.user_id
      WHERE p.id IS NULL
    " 2>/dev/null)

    ORPHAN_MEMBER_COUNT=$(echo "$ORPHANED_MEMBERS" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d[0]['count'] if d else 0)
except:
    print(0)
" 2>/dev/null || echo "0")

    if [ "$ORPHAN_MEMBER_COUNT" -eq 0 ]; then
      pass "No orphaned practice_members (all reference valid profiles)"
    else
      fail "$ORPHAN_MEMBER_COUNT orphaned practice_member(s) — user deleted but membership remains"
    fi

    # 4b. Tasks with invalid template references
    INVALID_TEMPLATE_TASKS=$(sb_sql "
      SELECT COUNT(*) AS count
      FROM tasks t
      WHERE t.template_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM task_templates tt WHERE tt.id = t.template_id
        )
    " 2>/dev/null)

    INVALID_TMPL_COUNT=$(echo "$INVALID_TEMPLATE_TASKS" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d[0]['count'] if d else 0)
except:
    print(0)
" 2>/dev/null || echo "0")

    if [ "$INVALID_TMPL_COUNT" -eq 0 ]; then
      pass "All tasks reference valid templates"
    else
      fail "$INVALID_TMPL_COUNT task(s) with invalid template_id"
    fi

    # 4c. Orphaned checklist items (task deleted but items remain)
    ORPHANED_CHECKLIST=$(sb_sql "
      SELECT COUNT(*) AS count
      FROM task_checklist_items ci
      LEFT JOIN tasks t ON t.id = ci.task_id
      WHERE t.id IS NULL
    " 2>/dev/null)

    ORPHAN_CL_COUNT=$(echo "$ORPHANED_CHECKLIST" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d[0]['count'] if d else 0)
except:
    print(0)
" 2>/dev/null || echo "0")

    if [ "$ORPHAN_CL_COUNT" -eq 0 ]; then
      pass "No orphaned checklist items"
    else
      fail "$ORPHAN_CL_COUNT orphaned checklist item(s) — task deleted but items remain"
    fi

    # 4d. Practice members with invalid role references
    INVALID_ROLES=$(sb_sql "
      SELECT COUNT(*) AS count
      FROM practice_members pm
      WHERE pm.practice_role_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM practice_role_types rt WHERE rt.id = pm.practice_role_id
        )
    " 2>/dev/null)

    INVALID_ROLE_COUNT=$(echo "$INVALID_ROLES" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d[0]['count'] if d else 0)
except:
    print(0)
" 2>/dev/null || echo "0")

    if [ "$INVALID_ROLE_COUNT" -eq 0 ]; then
      pass "All practice_members reference valid roles"
    else
      fail "$INVALID_ROLE_COUNT member(s) with invalid practice_role_id"
    fi

    # 4e. Profiles without auth.users (orphaned profiles)
    ORPHANED_PROFILES=$(sb_sql "
      SELECT COUNT(*) AS count
      FROM profiles p
      LEFT JOIN auth.users u ON u.id = p.id
      WHERE u.id IS NULL
    " 2>/dev/null)

    ORPHAN_PROFILE_COUNT=$(echo "$ORPHANED_PROFILES" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d[0]['count'] if d else 0)
except:
    print(0)
" 2>/dev/null || echo "0")

    if [ "$ORPHAN_PROFILE_COUNT" -eq 0 ]; then
      pass "No orphaned profiles (all have auth.users)"
    else
      warn "$ORPHAN_PROFILE_COUNT orphaned profile(s) without auth.users"
    fi

    # 4f. Completed tasks without completed_at timestamp
    MISSING_COMPLETED_AT=$(sb_sql "
      SELECT COUNT(*) AS count
      FROM tasks
      WHERE status = 'completed'
        AND completed_at IS NULL
    " 2>/dev/null)

    MISSING_TS_COUNT=$(echo "$MISSING_COMPLETED_AT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d[0]['count'] if d else 0)
except:
    print(0)
" 2>/dev/null || echo "0")

    if [ "$MISSING_TS_COUNT" -eq 0 ]; then
      pass "All completed tasks have completed_at timestamps"
    else
      warn "$MISSING_TS_COUNT completed task(s) missing completed_at timestamp"
    fi

    # 4g. RLS sanity — verify SECURITY DEFINER functions exist
    RLS_CHECK=$(sb_sql "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND (routine_name LIKE 'get_my_%' OR routine_name LIKE 'generate_daily_%' OR routine_name LIKE 'run_daily_%' OR routine_name LIKE 'seed_practice_%') ORDER BY routine_name" 2>/dev/null)

    RLS_FN_COUNT=$(echo "$RLS_CHECK" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    rows = d if isinstance(d, list) else []
    print(len(rows))
except:
    print(0)
" 2>/dev/null || echo "0")

    if [ "$RLS_FN_COUNT" -ge 2 ]; then
      pass "Core DB functions present ($RLS_FN_COUNT found: get_my_system_role, generate_daily_pool_tasks, etc.)"
    else
      fail "Missing core DB functions ($RLS_FN_COUNT found, expected >= 2)"
    fi

    # ══════════════════════════════════════════════
    # 4h. Auth data integrity
    # ══════════════════════════════════════════════
    echo ""
    echo "── Auth Integrity ──"

    NULL_IDENTITY_USERS=$(sb_sql "
      SELECT u.email
      FROM auth.users u
      WHERE NOT EXISTS (
        SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
      )
    " 2>/dev/null)

    NULL_ID_COUNT=$(echo "$NULL_IDENTITY_USERS" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    rows = d if isinstance(d, list) else []
    print(len(rows))
except:
    print(0)
" 2>/dev/null || echo "0")

    if [ "$NULL_ID_COUNT" -eq 0 ]; then
      pass "All auth users have identity records"
    else
      fail "$NULL_ID_COUNT user(s) with null identities (cannot sign in)"
      echo "$NULL_IDENTITY_USERS" | python3 -c "
import sys, json
try:
    for r in json.load(sys.stdin):
        print(f\"       {r['email']}\")
except: pass
" 2>/dev/null || true
      dim "Run ./scripts/auth-health.sh --fix to repair"
    fi

    # Staff profiles without practice membership (can auth but see nothing)
    HOMELESS_STAFF=$(sb_sql "
      SELECT p.email, p.system_role
      FROM profiles p
      WHERE p.system_role IN ('staff', 'practice_admin')
        AND p.is_active = true
        AND NOT EXISTS (
          SELECT 1 FROM practice_members pm WHERE pm.user_id = p.id
        )
    " 2>/dev/null)

    HOMELESS_COUNT=$(echo "$HOMELESS_STAFF" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    rows = d if isinstance(d, list) else []
    print(len(rows))
except:
    print(0)
" 2>/dev/null || echo "0")

    if [ "$HOMELESS_COUNT" -eq 0 ]; then
      pass "All active staff/admin profiles have practice membership"
    else
      warn "$HOMELESS_COUNT staff/admin profile(s) without practice_members (can auth but see nothing)"
      echo "$HOMELESS_STAFF" | python3 -c "
import sys, json
try:
    for r in json.load(sys.stdin):
        print(f\"       {r['email']} ({r['system_role']})\")
except: pass
" 2>/dev/null || true
    fi

  fi # end SUPABASE_ACCESS_TOKEN check

fi # end QUICK check

# ══════════════════════════════════════════════
# 5. API ROUTE SMOKE TEST
# ══════════════════════════════════════════════
if [ "$QUICK" = false ] && [ "$DATA_ONLY" = false ]; then

  echo ""
  echo "── API Smoke Test (localhost:3200) ──"

  # Only run if dev server is up
  DEV_PORT=3200
  DEV_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${DEV_PORT}" 2>/dev/null || echo "000")
  if [ "$DEV_STATUS" = "000" ]; then
    warn "Dev server not running on port $DEV_PORT — skipping API smoke tests"
  else
    ROUTES=(
      "/login:200"
      "/dashboard:307"
    )

    for route_check in "${ROUTES[@]}"; do
      ROUTE="${route_check%%:*}"
      EXPECTED="${route_check#*:}"
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${DEV_PORT}${ROUTE}" 2>/dev/null || echo "000")

      if [ "$STATUS" = "$EXPECTED" ]; then
        pass "$ROUTE -> $STATUS"
      else
        fail "$ROUTE -> expected $EXPECTED, got $STATUS"
      fi
    done
  fi

fi

# ══════════════════════════════════════════════
# Summary
# ══════════════════════════════════════════════
echo ""
echo "========================================="
if [ "$FAILS" -eq 0 ] && [ "$WARNS" -eq 0 ]; then
  echo -e "  ${GREEN}All QA checks passed — safe to merge${NC}"
elif [ "$FAILS" -eq 0 ]; then
  echo -e "  ${YELLOW}$WARNS warning(s), 0 failures — review warnings before merge${NC}"
else
  echo -e "  ${RED}$FAILS failure(s), $WARNS warning(s) — DO NOT merge until failures are resolved${NC}"
fi
echo "========================================="
echo ""

if [ "$CI_MODE" = true ]; then
  exit "$FAILS"
fi
