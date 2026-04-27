#!/usr/bin/env bash
set -euo pipefail

# Renew PMS — Design Token & Component Compliance Audit
# Run from project root: ./scripts/token-audit.sh
#
# Scans src/ for hardcoded values and raw HTML elements that should use
# BDS design tokens and components. Exit code 0 = clean, 1 = violations found.
#
# Shared standard with brik-client-portal — keep both scripts in sync.

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
echo "  Renew PMS — Token & Component Audit"
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

# ── 2. Hardcoded rgba/rgb ───────────────────────────────────────────
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

# ── 3. Native <button> instead of BDS Button / IconButton ──────────
section "Native <button> (use Button or IconButton from @brikdesigns/bds)"

# Allowlist:
#   - role="tab"  → PageHeader tabs (legitimate tablist semantics — convert to BDS TabBar when available)
#   - DevPersonaSwitcher → dev-only tool, not production UI
#   - TemplatesTable dropdown menu items → menu affordance (not a primary action button)
#   - bds-sheet__nav-link → BDS-sanctioned pattern; styling ships in @brikdesigns/bds/dist/styles.css
BUTTON_HITS=$(grep -rn --include="*.tsx" \
  -E "<button[ >]" "$SRC" \
  | grep -v 'role="tab"' \
  | grep -v "DevPersonaSwitcher" \
  | grep -v "TemplatesTable.*menu\|addMenuOpen\|handleAddClick" \
  | grep -v 'bds-sheet__nav-link' \
  | grep -v "// " \
  || true)

# Filter TemplatesTable dropdown buttons by checking for the menu context
BUTTON_HITS=$(echo "$BUTTON_HITS" | grep -v "TemplatesTable" || true)

BUTTON_COUNT=$(count_matches "$BUTTON_HITS")
if [ "$BUTTON_COUNT" -gt 0 ]; then
  echo -e "  ${RED}${BUTTON_COUNT} native <button> element(s) — use Button or IconButton${NC}"
  echo "$BUTTON_HITS" | head -10
  [ "$BUTTON_COUNT" -gt 10 ] && echo -e "  ${DIM}... and $((BUTTON_COUNT - 10)) more${NC}"
  VIOLATIONS=$((VIOLATIONS + BUTTON_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 4. Raw <a href> instead of Next.js Link ─────────────────────────
section "Raw <a href> (use Next.js Link or BDS TextLink)"

LINK_HITS=$(grep -rn --include="*.tsx" \
  -E '<a\s+href=' "$SRC" \
  | grep -v "// " \
  || true)

LINK_COUNT=$(count_matches "$LINK_HITS")
if [ "$LINK_COUNT" -gt 0 ]; then
  echo -e "  ${YELLOW}${LINK_COUNT} raw <a> tag(s)${NC}"
  echo "$LINK_HITS" | head -10
  [ "$LINK_COUNT" -gt 10 ] && echo -e "  ${DIM}... and $((LINK_COUNT - 10)) more${NC}"
  VIOLATIONS=$((VIOLATIONS + LINK_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 5. Raw var() strings in style props ─────────────────────────────
section "Raw var() strings in style props (use @/lib/tokens)"

RAW_VAR_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E ":\s*['\"]var\(--" "$SRC" \
  | grep -v "src/lib/tokens\.ts" \
  | grep -v "src/lib/styles\.ts" \
  | grep -v "src/styles/" \
  | grep -v "DevPersonaSwitcher" \
  | grep -v "color-mix(" \
  | grep -v "// " \
  || true)

RAW_VAR_COUNT=$(count_matches "$RAW_VAR_HITS")
if [ "$RAW_VAR_COUNT" -gt 0 ]; then
  echo -e "  ${RED}${RAW_VAR_COUNT} raw var() reference(s)${NC}"
  echo -e "  ${DIM}Use: import { color, font, gap, border } from '@/lib/tokens'${NC}"
  echo "$RAW_VAR_HITS" | head -10
  [ "$RAW_VAR_COUNT" -gt 10 ] && echo -e "  ${DIM}... and $((RAW_VAR_COUNT - 10)) more${NC}"
  VIOLATIONS=$((VIOLATIONS + RAW_VAR_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 6. Hardcoded font sizes ─────────────────────────────────────────
section "Hardcoded font sizes (use font.size.* from @/lib/tokens)"

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

# ── 7. Hardcoded fontFamily strings ─────────────────────────────────
section "Hardcoded fontFamily (use font.family.* from @/lib/tokens)"

FAMILY_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "fontFamily:\s*'" "$SRC" \
  | grep -v "var(--" \
  | grep -v "src/lib/tokens\.ts" \
  | grep -v "src/lib/styles\.ts" \
  | grep -v "DevPersonaSwitcher" \
  || true)

FAMILY_COUNT=$(count_matches "$FAMILY_HITS")
if [ "$FAMILY_COUNT" -gt 0 ]; then
  echo -e "  ${RED}${FAMILY_COUNT} hardcoded fontFamily value(s)${NC}"
  echo "$FAMILY_HITS" | head -10
  VIOLATIONS=$((VIOLATIONS + FAMILY_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 8. Hardcoded borderRadius ────────────────────────────────────────
section "Hardcoded borderRadius (use border.radius.* from @/lib/tokens)"

BR_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "borderRadius:\s*'[0-9]+" "$SRC" \
  | grep -v "var(--" \
  | grep -v "src/lib/tokens\.ts" \
  | grep -v "DevPersonaSwitcher" \
  || true)

BR_COUNT=$(count_matches "$BR_HITS")
if [ "$BR_COUNT" -gt 0 ]; then
  echo -e "  ${YELLOW}${BR_COUNT} hardcoded borderRadius value(s)${NC}"
  echo "$BR_HITS" | head -10
  [ "$BR_COUNT" -gt 10 ] && echo -e "  ${DIM}... and $((BR_COUNT - 10)) more${NC}"
  VIOLATIONS=$((VIOLATIONS + BR_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 9. Hardcoded px gap values ───────────────────────────────────────
section "Hardcoded px gap values (use gap.* from @/lib/tokens)"

# Only flag gaps >= 4px (sub-4px micro-layout is intentional)
GAP_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "gap:\s*'([4-9][0-9]*|[0-9]{2,})px'" "$SRC" \
  | grep -v "DevPersonaSwitcher" \
  || true)

GAP_COUNT=$(count_matches "$GAP_HITS")
if [ "$GAP_COUNT" -gt 0 ]; then
  echo -e "  ${YELLOW}${GAP_COUNT} hardcoded gap value(s)${NC}"
  echo "$GAP_HITS" | head -10
  [ "$GAP_COUNT" -gt 10 ] && echo -e "  ${DIM}... and $((GAP_COUNT - 10)) more${NC}"
  VIOLATIONS=$((VIOLATIONS + GAP_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 10. Hardcoded px padding/margin ─────────────────────────────────
section "Hardcoded px padding/margin (high-volume — report count only)"

SPACING_PROPS="(padding|paddingTop|paddingBottom|paddingLeft|paddingRight|paddingInline|paddingBlock|margin|marginTop|marginBottom|marginLeft|marginRight)"
SPACING_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "${SPACING_PROPS}:\s*'[0-9]+px" "$SRC" \
  | grep -v "var(--" \
  | grep -v "src/lib/tokens\.ts" \
  | grep -v "DevPersonaSwitcher" \
  || true)

SPACING_COUNT=$(count_matches "$SPACING_HITS")
if [ "$SPACING_COUNT" -gt 0 ]; then
  echo -e "  ${YELLOW}${SPACING_COUNT} hardcoded px spacing value(s)${NC}"
  echo "$SPACING_HITS" | sed 's/:.*$//' | sort | uniq -c | sort -rn | head -10
  echo -e "  ${DIM}(Top 10 files by count — fix file-by-file)${NC}"
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 11. Direct BDS component path imports ───────────────────────────
section "Direct BDS component imports (use '@brikdesigns/bds' barrel)"

DIRECT_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "from '@bds/components|from '@brikdesigns/bds/" "$SRC" \
  || true)

DIRECT_COUNT=$(count_matches "$DIRECT_HITS")
if [ "$DIRECT_COUNT" -gt 0 ]; then
  echo -e "  ${RED}${DIRECT_COUNT} direct path import(s)${NC}"
  echo "$DIRECT_HITS" | head -10
  VIOLATIONS=$((VIOLATIONS + DIRECT_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 12. Badge missing size prop ──────────────────────────────────────
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

# ── 13. Client theme completeness ───────────────────────────────────
section "Client theme completeness (all font-family tokens must be explicit)"
#
# Why this check exists:
#   BDS defines font-family tokens with Poppins defaults in figma-tokens.css.
#   Client themes MUST explicitly override every token — even when two tokens
#   share the same family value (e.g. display = heading = Century Schoolbook).
#   Omitting any token silently falls through to the BDS Poppins default.
#
#   --font-family-subtitle is a BDS gap-fill token (not yet in Figma variables).
#   It lives only in overrides.css as var(--font-family-label) — invisible to
#   Figma exports and will always be missed by a sync unless checked here.

REQUIRED_FONT_TOKENS=(
  "font-family-heading"
  "font-family-display"
  "font-family-body"
  "font-family-label"
  "font-family-subtitle"
)

THEME_VIOLATIONS=0
for theme_file in src/styles/theme-*.css; do
  [ -f "$theme_file" ] || continue
  for token in "${REQUIRED_FONT_TOKENS[@]}"; do
    if ! grep -q "\-\-${token}:" "$theme_file"; then
      echo -e "  ${RED}MISSING${NC} --${token} in ${theme_file}"
      THEME_VIOLATIONS=$((THEME_VIOLATIONS + 1))
    fi
  done
done

if [ "$THEME_VIOLATIONS" -eq 0 ]; then
  echo -e "  ${GREEN}Clean${NC}"
else
  VIOLATIONS=$((VIOLATIONS + THEME_VIOLATIONS))
fi

# ── 14. headingStyle variable naming drift ──────────────────────────
# Per BDS naming-conventions: BEM slot for a heading-role text element is
# __title; the typography token is named `heading`. Variables holding the
# CSSProperties for a title-role text element should be `titleStyle`, not
# `headingStyle`. Same role, different layer.
# See docs/qa/component-cleanup-audit.md (Cat 6) and cleanup-workflow.md.
section "headingStyle variable name (use titleStyle per BDS BEM convention)"

HEADING_VAR_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "const\s+\w*[Hh]eadingStyle\b" "$SRC" \
  | grep -v "src/lib/styles\.ts" \
  | grep -v "DevPersonaSwitcher" \
  | grep -v "// " \
  || true)

HEADING_VAR_COUNT=$(count_matches "$HEADING_VAR_HITS")
if [ "$HEADING_VAR_COUNT" -gt 0 ]; then
  echo -e "  ${YELLOW}${HEADING_VAR_COUNT} headingStyle variable(s) — rename to titleStyle${NC}"
  echo -e "  ${DIM}BDS naming: BEM slot is __title; typography token is heading. Variable holding title styles → titleStyle.${NC}"
  echo "$HEADING_VAR_HITS" | head -10
  VIOLATIONS=$((VIOLATIONS + HEADING_VAR_COUNT))
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
  echo ""
  echo "  Priority order:"
  echo "  1. Theme completeness — missing font-family tokens fall through to Poppins"
  echo "  2. Native <button> — missing interaction states, breaking BDS"
  echo "  3. Raw var() strings — bypasses type-safe token layer"
  echo "  4. Hardcoded colors — breaks dark mode / client theming"
  echo "  5. Hardcoded fontFamily/fontSize — invisible until client theme"
  echo "  6. Hardcoded borderRadius/gap — breaks spacing scale"
  echo "  7. Badge missing size — admin UI standard"
  echo "  8. headingStyle variable name — BEM slot drift, future debt"
  echo "  9. Hardcoded px padding/margin — fix file-by-file"
fi
echo "========================================="
echo ""

exit $((VIOLATIONS > 0 ? 1 : 0))
