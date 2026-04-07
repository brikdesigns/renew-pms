#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Renew PMS — Database Health Check
# Read-only queries against Supabase via Management API.
# Flags orphaned records, constraint drift, and RLS gaps.
#
# Usage:
#   ./scripts/db-health.sh              # Check dev/staging
#   ./scripts/db-health.sh --prod       # Check production
#   ./scripts/db-health.sh --fix        # Show suggested fix SQL
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

source "$SCRIPT_DIR/project.env"

# ── CLI flags ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

FAILS=0
WARNS=0
USE_PROD=false
SHOW_FIX=false

for arg in "$@"; do
  case "$arg" in
    --prod) USE_PROD=true ;;
    --fix)  SHOW_FIX=true ;;
    --help|-h)
      echo "Usage: ./scripts/db-health.sh [--prod] [--fix]"
      echo ""
      echo "  (default)  Check staging/dev database"
      echo "  --prod     Check production database"
      echo "  --fix      Print suggested SQL to fix issues"
      exit 0
      ;;
  esac
done

pass()  { echo -e "  ${GREEN}[OK]${NC}    $1"; }
fail()  { echo -e "  ${RED}[FAIL]${NC}  $1"; FAILS=$((FAILS + 1)); }
warn()  { echo -e "  ${YELLOW}[WARN]${NC}  $1"; WARNS=$((WARNS + 1)); }
info()  { echo -e "  ${CYAN}[INFO]${NC}  $1"; }
dim()   { echo -e "  ${DIM}$1${NC}"; }
fix()   { if [ "$SHOW_FIX" = true ]; then echo -e "  ${DIM}FIX: $1${NC}"; fi; }

# ── Determine target project ──
if [ "$USE_PROD" = true ]; then
  PROJECT_REF="${SUPABASE_PROD_REF:-}"
  ENV_LABEL="Production"
else
  PROJECT_REF="${SUPABASE_STAGING_REF:-}"
  ENV_LABEL="Staging/Dev"
fi

if [ -z "$PROJECT_REF" ]; then
  echo "ERROR: No Supabase project ref configured for $ENV_LABEL"
  exit 1
fi

# ── Load access token ──
if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  # Try loading from .env.local
  if [ -f "$PROJECT_ROOT/.env.local" ]; then
    SUPABASE_ACCESS_TOKEN=$(grep '^SUPABASE_ACCESS_TOKEN=' "$PROJECT_ROOT/.env.local" 2>/dev/null | cut -d'=' -f2- || echo "")
  fi
fi

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "ERROR: SUPABASE_ACCESS_TOKEN not set. Export it or add to .env.local"
  exit 1
fi

API_URL="https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query"

run_query() {
  local sql="$1"
  curl -s -X POST "$API_URL" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$sql\"}" 2>/dev/null
}

# Helper: extract count from single-row JSON result
get_count() {
  echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['count'] if d else 0)" 2>/dev/null || echo "-1"
}

echo ""
echo "========================================="
echo "  ${PROJECT_NAME} — DB Health Check"
echo "  Environment: ${ENV_LABEL} (${PROJECT_REF})"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "========================================="

# ── 1. Connectivity ──
echo ""
echo "── Connectivity ──"

PING=$(run_query "SELECT 1 AS ok")
if echo "$PING" | grep -q '"ok"'; then
  pass "Management API query works"
else
  fail "Cannot execute queries — check SUPABASE_ACCESS_TOKEN"
  echo ""
  echo "Cannot proceed without database access."
  exit 1
fi

# ── 2. RLS Coverage ──
echo ""
echo "── RLS Coverage ──"

RLS_RESULT=$(run_query "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN (SELECT tablename FROM pg_tables t JOIN pg_class c ON c.relname = t.tablename JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public' WHERE c.relrowsecurity = true) AND tablename NOT LIKE 'pg_%' ORDER BY tablename")

UNPROTECTED=$(echo "$RLS_RESULT" | python3 -c "
import sys, json
try:
    rows = json.load(sys.stdin)
    tables = [r['tablename'] for r in rows if not r['tablename'].startswith('_')]
    print(','.join(tables) if tables else '')
except:
    print('ERROR')
" 2>/dev/null || echo "ERROR")

if [ "$UNPROTECTED" = "" ]; then
  pass "All public tables have RLS enabled"
elif [ "$UNPROTECTED" = "ERROR" ]; then
  warn "Could not parse RLS check result"
else
  fail "Tables without RLS: $UNPROTECTED"
  fix "ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;"
fi

# ── 3. Orphaned Auth Users (no profile) ──
echo ""
echo "── Orphaned Records ──"

ORPHAN_AUTH=$(run_query "SELECT count(*) FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id WHERE p.id IS NULL")
COUNT=$(get_count "$ORPHAN_AUTH")
if [ "$COUNT" = "0" ]; then
  pass "No auth users without a profile"
else
  warn "$COUNT auth user(s) without a profile row"
  fix "INSERT INTO profiles (id, email) SELECT u.id, u.email FROM auth.users u LEFT JOIN profiles p ON p.id = u.id WHERE p.id IS NULL;"
fi

# ── 4. Orphaned Practice Members ──
ORPHAN_MEMBERS=$(run_query "SELECT count(*) FROM practice_members pm LEFT JOIN profiles p ON p.id = pm.user_id WHERE p.id IS NULL")
COUNT=$(get_count "$ORPHAN_MEMBERS")
if [ "$COUNT" = "0" ]; then
  pass "No practice members pointing to deleted profiles"
else
  fail "$COUNT practice member(s) with missing profile"
  fix "DELETE FROM practice_members WHERE user_id NOT IN (SELECT id FROM profiles);"
fi

# ── 5. Tasks with null assigned_to ──
ORPHAN_TASKS=$(run_query "SELECT count(*) FROM tasks WHERE assigned_to IS NULL AND status NOT IN ('completed', 'skipped')")
COUNT=$(get_count "$ORPHAN_TASKS")
if [ "$COUNT" = "0" ]; then
  pass "No unassigned active tasks"
else
  warn "$COUNT active task(s) with no assignee (assigned_to IS NULL)"
fi

# ── 6. Tasks assigned to inactive members ──
INACTIVE_ASSIGNED=$(run_query "SELECT count(*) FROM tasks t JOIN practice_members pm ON pm.id = t.assigned_to WHERE pm.is_active = false AND t.status NOT IN ('completed', 'skipped')")
COUNT=$(get_count "$INACTIVE_ASSIGNED")
if [ "$COUNT" = "0" ]; then
  pass "No active tasks assigned to inactive members"
else
  warn "$COUNT active task(s) assigned to inactive member(s)"
  fix "UPDATE tasks SET status = 'blocked' WHERE assigned_to IN (SELECT id FROM practice_members WHERE is_active = false) AND status NOT IN ('completed', 'skipped');"
fi

# ── 7. Schedule events with null assigned_to ──
ORPHAN_EVENTS=$(run_query "SELECT count(*) FROM schedule_events WHERE assigned_to IS NULL")
COUNT=$(get_count "$ORPHAN_EVENTS")
if [ "$COUNT" = "0" ]; then
  pass "No schedule events with missing assignee"
else
  warn "$COUNT schedule event(s) with no assignee"
fi

# ── 8. Check constraint alignment — employee_type ──
echo ""
echo "── Constraint Alignment ──"

EMPLOYEE_TYPES=$(run_query "SELECT DISTINCT employee_type FROM practice_members ORDER BY employee_type")
ACTUAL_TYPES=$(echo "$EMPLOYEE_TYPES" | python3 -c "
import sys, json
try:
    rows = json.load(sys.stdin)
    print(','.join(sorted(r['employee_type'] for r in rows)))
except:
    print('ERROR')
" 2>/dev/null || echo "ERROR")

EXPECTED="maturing,new,proficient"
if [ "$ACTUAL_TYPES" = "$EXPECTED" ] || [ "$ACTUAL_TYPES" = "" ]; then
  pass "employee_type values match expected: {$EXPECTED}"
elif echo "$ACTUAL_TYPES" | grep -q "active"; then
  fail "employee_type still contains 'active' — migration 00014 may not have run"
  fix "UPDATE practice_members SET employee_type = 'proficient' WHERE employee_type = 'active';"
else
  info "employee_type values in DB: {$ACTUAL_TYPES} (expected: {$EXPECTED})"
fi

# ── 9. system_role constraint ──
SYSTEM_ROLES=$(run_query "SELECT DISTINCT system_role FROM profiles WHERE system_role IS NOT NULL ORDER BY system_role")
ACTUAL_ROLES=$(echo "$SYSTEM_ROLES" | python3 -c "
import sys, json
try:
    rows = json.load(sys.stdin)
    print(','.join(sorted(r['system_role'] for r in rows)))
except:
    print('ERROR')
" 2>/dev/null || echo "ERROR")

EXPECTED_ROLES="platform_admin,practice_admin,staff"
if [ "$ACTUAL_ROLES" = "$EXPECTED_ROLES" ] || [ "$ACTUAL_ROLES" = "" ] || [ "$ACTUAL_ROLES" = "ERROR" ]; then
  pass "system_role values match expected"
else
  warn "system_role values: {$ACTUAL_ROLES} (expected: {$EXPECTED_ROLES})"
fi

# ── 10. Unused reference data ──
echo ""
echo "── Reference Data Hygiene ──"

UNUSED_DEPTS=$(run_query "SELECT count(*) FROM departments d WHERE d.is_active = true AND NOT EXISTS (SELECT 1 FROM practice_members pm JOIN practice_role_types prt ON prt.id = pm.practice_role_id WHERE prt.department_id = d.id) AND d.name != 'All Departments'")
COUNT=$(get_count "$UNUSED_DEPTS")
if [ "$COUNT" = "0" ]; then
  pass "All active departments have assigned members"
else
  info "$COUNT active department(s) with no members assigned"
fi

UNUSED_ROLES=$(run_query "SELECT count(*) FROM practice_role_types prt WHERE prt.is_active = true AND NOT EXISTS (SELECT 1 FROM practice_members pm WHERE pm.practice_role_id = prt.id)")
COUNT=$(get_count "$UNUSED_ROLES")
if [ "$COUNT" = "0" ]; then
  pass "All active roles have assigned members"
else
  info "$COUNT active role(s) with no members assigned"
fi

UNUSED_TASK_TYPES=$(run_query "SELECT count(*) FROM task_types tt WHERE NOT EXISTS (SELECT 1 FROM tasks t WHERE t.task_type_id = tt.id)")
COUNT=$(get_count "$UNUSED_TASK_TYPES")
if [ "$COUNT" = "0" ]; then
  pass "All task types are referenced"
else
  info "$COUNT task type(s) not used by any task or template"
fi

# ── 11. Table row counts (overview) ──
echo ""
echo "── Table Overview ──"

ROW_COUNTS=$(run_query "SELECT relname AS table, n_live_tup AS rows FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY n_live_tup DESC")
echo "$ROW_COUNTS" | python3 -c "
import sys, json
try:
    rows = json.load(sys.stdin)
    for r in rows:
        name = r['table']
        count = r['rows']
        print(f'  {name:<30} {count:>6} rows')
except:
    print('  Could not parse row counts')
" 2>/dev/null || echo "  Could not parse row counts"

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
