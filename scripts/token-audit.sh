#!/usr/bin/env bash
set -euo pipefail

# Renew PMS — Design Token Compliance Audit
# Run from project root: ./scripts/token-audit.sh
#
# Scans src/ for hardcoded values that should use BDS design tokens.
# Exit code 0 = clean, 1 = violations found.

SRC="src"
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
DIM='\033[2m'
NC='\033[0m'
VIOLATIONS=0

section() { echo -e "\n${YELLOW}── $1 ──${NC}"; }
count_matches() {
  if [ -z "$1" ]; then echo 0; else echo "$1" | grep -c "." 2>/dev/null || echo 0; fi
}

echo ""
echo "========================================="
echo "  Renew PMS — Token Compliance Audit"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "========================================="

# ── 1. Hardcoded hex colors ─────────────────────────────────────────
section "Hardcoded hex colors"

COLOR_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "'#[0-9a-fA-F]{3,8}'" "$SRC" \
  | grep -v "DevPersonaSwitcher" \
  | grep -v "theme-renew" \
  | grep -v "// " \
  || true)

COLOR_COUNT=$(count_matches "$COLOR_HITS")
if [ "$COLOR_COUNT" -gt 0 ]; then
  echo -e "  ${RED}${COLOR_COUNT} hardcoded hex color(s)${NC}"
  echo "$COLOR_HITS" | head -10
  [ "$COLOR_COUNT" -gt 10 ] && echo -e "  ${DIM}... and $((COLOR_COUNT - 10)) more${NC}"
  VIOLATIONS=$((VIOLATIONS + COLOR_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 2. Raw var() strings in inline styles ───────────────────────────
section "Raw var() strings in style props (should use @/lib/tokens)"

RAW_VAR_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E ":\s*['\"]var\(--" "$SRC" \
  | grep -v "src/lib/tokens\.ts" \
  | grep -v "src/lib/styles\.ts" \
  | grep -v "src/styles/" \
  | grep -v "color-mix(" \
  | grep -v "DevPersonaSwitcher" \
  | grep -v "// " \
  || true)

RAW_VAR_COUNT=$(count_matches "$RAW_VAR_HITS")
if [ "$RAW_VAR_COUNT" -gt 0 ]; then
  echo -e "  ${RED}${RAW_VAR_COUNT} raw var() reference(s) — import { color, font, gap } from '@/lib/tokens'${NC}"
  echo "$RAW_VAR_HITS" | head -10
  [ "$RAW_VAR_COUNT" -gt 10 ] && echo -e "  ${DIM}... and $((RAW_VAR_COUNT - 10)) more${NC}"
  VIOLATIONS=$((VIOLATIONS + RAW_VAR_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 3. Hardcoded font sizes ─────────────────────────────────────────
section "Hardcoded font sizes (should use font.size.* from @/lib/tokens)"

FONT_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  "fontSize: '[0-9]" "$SRC" \
  | grep -v "src/lib/tokens\.ts" \
  | grep -v "src/lib/styles\.ts" \
  | grep -v "DevPersonaSwitcher" \
  || true)

FONT_COUNT=$(count_matches "$FONT_HITS")
if [ "$FONT_COUNT" -gt 0 ]; then
  echo -e "  ${RED}${FONT_COUNT} hardcoded font size(s)${NC}"
  echo "$FONT_HITS" | head -10
  VIOLATIONS=$((VIOLATIONS + FONT_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 4. Direct BDS component path imports ────────────────────────────
section "Direct BDS component imports (should use '@bds/components' barrel)"

DIRECT_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  "from '@bds/components/ui/" "$SRC" \
  || true)

DIRECT_COUNT=$(count_matches "$DIRECT_HITS")
if [ "$DIRECT_COUNT" -gt 0 ]; then
  echo -e "  ${RED}${DIRECT_COUNT} direct path import(s)${NC}"
  echo "$DIRECT_HITS" | head -10
  VIOLATIONS=$((VIOLATIONS + DIRECT_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 5. Badge missing size prop ──────────────────────────────────────
section "Badge missing size prop (standard: size=\"sm\")"

BADGE_HITS=$(grep -rn --include="*.tsx" \
  -E "<Badge\b[^>]*>" "$SRC" \
  | grep -v 'size=' \
  | grep -v "// " \
  || true)

BADGE_COUNT=$(count_matches "$BADGE_HITS")
if [ "$BADGE_COUNT" -gt 0 ]; then
  echo -e "  ${YELLOW}${BADGE_COUNT} Badge(s) missing size prop${NC}"
  echo "$BADGE_HITS" | head -10
  VIOLATIONS=$((VIOLATIONS + BADGE_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 6. Hardcoded rgba/rgb ───────────────────────────────────────────
section "Hardcoded rgba/rgb values"

RGBA_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "rgba?\([0-9]" "$SRC" \
  | grep -v "DevPersonaSwitcher" \
  | grep -v "// " \
  || true)

RGBA_COUNT=$(count_matches "$RGBA_HITS")
if [ "$RGBA_COUNT" -gt 0 ]; then
  echo -e "  ${RED}${RGBA_COUNT} hardcoded rgba/rgb value(s)${NC}"
  echo "$RGBA_HITS" | head -5
  VIOLATIONS=$((VIOLATIONS + RGBA_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── Summary ─────────────────────────────────────────────────────────
echo ""
echo "========================================="
if [ "$VIOLATIONS" -eq 0 ]; then
  echo -e "  ${GREEN}All checks passed — 0 violations${NC}"
else
  echo -e "  ${RED}${VIOLATIONS} violation(s) found${NC}"
fi
echo "========================================="
echo ""

exit $((VIOLATIONS > 0 ? 1 : 0))
