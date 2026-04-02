#!/usr/bin/env bash
set -euo pipefail

# Renew PMS — BDS Submodule Sync
# Pulls latest BDS from GitHub, builds portal, optionally commits.
#
# Usage:
#   ./scripts/bds-sync.sh              # Pull + build + commit
#   ./scripts/bds-sync.sh --dry-run    # Pull + build only (no commit)
#   ./scripts/bds-sync.sh --check      # Show current vs latest (no changes)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BDS_DIR="$PROJECT_ROOT/brik-bds"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "  ${CYAN}[INFO]${NC}  $1"; }
pass()  { echo -e "  ${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "  ${YELLOW}[WARN]${NC}  $1"; }
fail()  { echo -e "  ${RED}[FAIL]${NC}  $1"; }

DRY_RUN=false
CHECK_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --check)   CHECK_ONLY=true ;;
    --help|-h)
      echo "Usage: ./scripts/bds-sync.sh [--dry-run|--check]"
      echo ""
      echo "  (default)   Pull latest BDS, build portal, commit submodule ref"
      echo "  --dry-run   Pull + build, but don't commit"
      echo "  --check     Show current vs latest commit (no changes)"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      exit 1
      ;;
  esac
done

echo ""
echo "========================================="
echo "  BDS Submodule Sync"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "========================================="
echo ""

cd "$PROJECT_ROOT"

# ── Guard: submodule initialized ──
if [ ! -d "$BDS_DIR/.git" ] && [ ! -f "$BDS_DIR/.git" ]; then
  fail "brik-bds submodule not initialized. Run: git submodule update --init"
  exit 1
fi

# ── Guard: no uncommitted portal changes (except brik-bds) ──
DIRTY=$(git diff --name-only HEAD 2>/dev/null | grep -v '^brik-bds$' || true)
if [ -n "$DIRTY" ] && [ "$CHECK_ONLY" = false ]; then
  warn "You have uncommitted portal changes:"
  echo "$DIRTY" | sed 's/^/         /'
  echo ""
  read -rp "  Continue anyway? (y/N) " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "  Aborted."
    exit 0
  fi
fi

# ── Step 1: Get current and latest ──
CURRENT_SHA=$(cd "$BDS_DIR" && git rev-parse HEAD | cut -c1-7)
info "Current BDS commit: $CURRENT_SHA"

(cd "$BDS_DIR" && git fetch origin 2>/dev/null)

REMOTE_BRANCH=$(cd "$BDS_DIR" && git rev-parse --abbrev-ref origin/HEAD 2>/dev/null || echo "origin/main")
LATEST_SHA=$(cd "$BDS_DIR" && git rev-parse "$REMOTE_BRANCH" | cut -c1-7)
LATEST_MSG=$(cd "$BDS_DIR" && git log --oneline -1 --no-decorate "$REMOTE_BRANCH")

if [ "$CURRENT_SHA" = "$LATEST_SHA" ]; then
  pass "Already up to date ($CURRENT_SHA)"
  echo ""
  exit 0
fi

info "Latest remote: $LATEST_SHA"
info "$LATEST_MSG"
echo ""

# ── Check-only ──
if [ "$CHECK_ONLY" = true ]; then
  info "Commits since $CURRENT_SHA:"
  (cd "$BDS_DIR" && git log --oneline "$CURRENT_SHA..$REMOTE_BRANCH" --no-decorate) | sed 's/^/         /'
  echo ""
  exit 0
fi

# ── Update submodule ──
info "Updating submodule..."
git submodule update --remote brik-bds 2>/dev/null

if [ -n "$(cd "$BDS_DIR" && git diff --name-only 2>/dev/null)" ]; then
  warn "Discarding stale edits in brik-bds/ submodule (committed upstream)"
  (cd "$BDS_DIR" && git checkout -- .)
fi

pass "Updated: $CURRENT_SHA -> $LATEST_SHA"
echo ""

# ── Token documentation drift check ──
# Verify that heading token comments in src/lib/tokens.ts match actual
# resolved values in brik-bds/tokens/figma-tokens.css.
# Catches cases where a Figma update changes a token value but the
# tokens.ts comment table isn't updated — keeping docs accurate for agents.
info "Checking heading token documentation..."

TOKENS_CSS="$BDS_DIR/tokens/figma-tokens.css"
TOKENS_TS="$PROJECT_ROOT/src/lib/tokens.ts"

if [ -f "$TOKENS_CSS" ] && [ -f "$TOKENS_TS" ]; then
  DRIFT=false

  # Extract resolved px values for key heading tokens from figma-tokens.css
  # Each token resolves via var() chain — grep the primitive font-size values
  check_token() {
    local token_name="$1"   # e.g. --heading-tiny
    local expected_px="$2"  # e.g. 18px
    local comment_label="$3" # e.g. heading.tiny

    # Find what font-size variable --heading-tiny resolves to
    local var_ref
    var_ref=$(grep -E "^\s+${token_name}:" "$TOKENS_CSS" | head -1 | grep -oE 'var\(--font-size-[0-9]+\)' | head -1 || true)
    if [ -z "$var_ref" ]; then return; fi

    local fs_var
    fs_var=$(echo "$var_ref" | grep -oE -- '--font-size-[0-9]+')
    local actual_px
    actual_px=$(grep -E "^\s+${fs_var}:" "$TOKENS_CSS" | head -1 | grep -oE '[0-9.]+px' | head -1 || true)

    if [ -n "$actual_px" ] && [ "$actual_px" != "$expected_px" ]; then
      warn "Token drift: $comment_label documents ${expected_px} but ${token_name} resolves to ${actual_px}"
      warn "  Update comment in src/lib/tokens.ts for $comment_label"
      DRIFT=true
    fi
  }

  check_token "--heading-tiny" "18px" "heading.tiny"
  check_token "--heading-sm"   "20px" "heading.small"
  check_token "--heading-md"   "22.5px" "heading.medium"
  check_token "--heading-lg"   "28.5px" "heading.large"
  check_token "--heading-xl"   "32px" "heading.xLarge"
  check_token "--heading-xxl"  "36px" "heading.xxLarge"
  check_token "--heading-huge" "40.5px" "heading.xxxLarge"

  if [ "$DRIFT" = false ]; then
    pass "Heading token documentation is accurate"
  else
    echo ""
    warn "Update tokens.ts comment table to match current BDS values before committing."
    echo ""
  fi
fi
echo ""

# ── Build ──
info "Building..."
echo ""

if npm run build; then
  echo ""
  pass "Build succeeded"
else
  echo ""
  fail "Build failed — submodule updated but not committed"
  fail "Fix build errors, then: git add brik-bds && git commit"
  exit 1
fi

echo ""

# ── Commit ──
if [ "$DRY_RUN" = true ]; then
  warn "Dry run — skipping commit"
  info "To commit: git add brik-bds && git commit -m 'Update BDS submodule to $LATEST_SHA'"
  echo ""
  exit 0
fi

git add brik-bds
git commit -m "Sync BDS submodule to $LATEST_SHA

$LATEST_MSG"

pass "Committed submodule update"
info "Push when ready: git push origin $(git branch --show-current)"
echo ""
