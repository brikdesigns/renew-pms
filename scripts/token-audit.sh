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

# Allowlist (file-wide unless noted):
#   - DevPersonaSwitcher → dev-only tool, not production UI (Cat 2d #25)
#   - VendorSidebar → nav icon button deferred to BDS NavItem promotion (Cat 2c #15)
#   - bds-sheet__nav-link → BDS-sanctioned class shipped in @brikdesigns/bds/dist/styles.css
#
# Detection: scan each .tsx file for <button> tag openings, including those
# split across multiple lines. The opening tag accumulates from `<button`
# through the first `>` so attributes on subsequent lines (className, style,
# onClick) are captured in a single emitted record. Multi-line content is
# joined with " <<< " so downstream `grep -v` filters still see every attr.
BUTTON_HITS=$(find "$SRC" -type f -name "*.tsx" | while read -r f; do
  awk '
    function tag_closed(line,    t) {
      t = line
      gsub(/=>/, "==", t)
      return index(t, ">") > 0
    }
    {
      if (capturing) {
        accumulated = accumulated " <<< " $0
        if (tag_closed($0)) {
          print FILENAME ":" start_line ":" accumulated
          capturing = 0
          accumulated = ""
        }
        next
      }
      if (match($0, /<button([[:space:]>]|$)/)) {
        rest = substr($0, RSTART)
        if (tag_closed(rest)) {
          print FILENAME ":" NR ":" $0
        } else {
          capturing = 1
          start_line = NR
          accumulated = $0
        }
      }
    }
  ' "$f"
done \
  | grep -v "DevPersonaSwitcher" \
  | grep -v "VendorSidebar" \
  | grep -v 'bds-sheet__nav-link' \
  | grep -v "// " \
  || true)

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

# ── 15. headerStyle variable holding text styles ────────────────────
# A `\w*headerStyle` variable that holds font-related CSS properties is
# really a *label* (or *title*) style, not chrome. Per the BDS naming
# convention, variables holding text-element styles belong to the
# `-label` or `-title` family — not `-header`. Chrome `headerStyle`
# (flex containers, padding, alignment only) are fine and not flagged.
# Detection: scan each `const \w*headerStyle: CSSProperties = { ... }`
# block for fontSize, fontFamily, fontWeight, letterSpacing, lineHeight,
# textTransform, or textDecoration. Block boundary is the closing `};`.
# See docs/qa/component-cleanup-audit.md (Cat 6) and Triage Batch 3b.
section "headerStyle variable holding text styles (use *labelStyle / *titleStyle)"

HEADER_TEXT_HITS=$(find "$SRC" -type f \( -name "*.tsx" -o -name "*.ts" \) \
  | grep -v "src/lib/styles\.ts" \
  | while read -r f; do
      awk -v file="$f" '
        /const[[:space:]]+[A-Za-z_]*[Hh]eaderStyle[[:space:]]*:/ {
          decl_line = NR
          decl_text = $0
          capturing = 1
          has_text_prop = 0
          next
        }
        capturing {
          if (/(fontSize|fontFamily|fontWeight|letterSpacing|lineHeight|textTransform|textDecoration):/) {
            has_text_prop = 1
          }
          if ($0 ~ /^};?$/) {
            if (has_text_prop) {
              print file ":" decl_line ":" decl_text
            }
            capturing = 0
          }
        }
      ' "$f"
    done)

HEADER_TEXT_COUNT=$(count_matches "$HEADER_TEXT_HITS")
if [ "$HEADER_TEXT_COUNT" -gt 0 ]; then
  echo -e "  ${YELLOW}${HEADER_TEXT_COUNT} headerStyle variable(s) holding text styles — rename to *labelStyle (or *titleStyle for title-role text)${NC}"
  echo -e "  ${DIM}BDS naming: variables holding text-element styles belong to the -label or -title family, not -header.${NC}"
  echo "$HEADER_TEXT_HITS" | head -10
  VIOLATIONS=$((VIOLATIONS + HEADER_TEXT_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 16. .bds-* selectors in consumer CSS (ratchet) ──────────────────
# Renew CSS must not target BDS internal class names. Every `.bds-*`
# selector in src/ is a consumer-side override of BDS internals, which
# silently masks BDS published behavior across releases (the failure
# mode that produced PR #220 — `.bds-page-header` override masking the
# 0.57.0 lean PageHeader for an entire release). Real divergences
# belong in BDS as a prop/variant, not as a consumer CSS rule.
# See issue #221 audit for the full taxonomy and BDS issues filed.
#
# Ratchet: the existing offenders are catalogued in #221 and pending
# BDS API work to retire. Until then, we lock the count so a NEW
# `.bds-*` selector can't sneak in. Decrease BDS_SELECTOR_BASELINE
# in the same PR that removes selectors.
#
# Exemption: a `.bds-*` selector that exists *only* to set the
# component-scoped CSS variables BDS publishes as override surfaces
# (e.g. `--page-header-content-gap`, `--select-chevron-color`) is a
# documented tuning, not an internal-style override. Tag the selector
# line with a `/* bds-lint-ignore */` marker — same convention BDS
# uses for component-scoped variable references — and the lint skips
# it. The marker forces an explicit acknowledgement that the rule is
# tuning a public BDS surface, not hijacking an internal one.
BDS_SELECTOR_BASELINE=28
section ".bds-* selectors in consumer CSS (ratchet — baseline ${BDS_SELECTOR_BASELINE})"

BDS_SELECTOR_HITS=$(find "$SRC" -type f -name "*.css" \
  | xargs grep -nE '^\s*\.bds-' 2>/dev/null \
  | grep -v 'bds-lint-ignore' \
  || true)

BDS_SELECTOR_COUNT=$(count_matches "$BDS_SELECTOR_HITS")
if [ "$BDS_SELECTOR_COUNT" -gt "$BDS_SELECTOR_BASELINE" ]; then
  NEW_COUNT=$((BDS_SELECTOR_COUNT - BDS_SELECTOR_BASELINE))
  echo -e "  ${RED}${BDS_SELECTOR_COUNT} .bds-* selector(s) in consumer CSS — ${NEW_COUNT} above baseline of ${BDS_SELECTOR_BASELINE}${NC}"
  echo -e "  ${DIM}New consumer-side overrides of BDS internals are not allowed. File as a BDS issue, add the prop/variant in BDS, then consume it. See issue #221 for the existing-offenders queue.${NC}"
  echo "$BDS_SELECTOR_HITS" | head -20
  VIOLATIONS=$((VIOLATIONS + NEW_COUNT))
elif [ "$BDS_SELECTOR_COUNT" -lt "$BDS_SELECTOR_BASELINE" ]; then
  echo -e "  ${YELLOW}${BDS_SELECTOR_COUNT} .bds-* selector(s) — below baseline of ${BDS_SELECTOR_BASELINE}; lower BDS_SELECTOR_BASELINE in scripts/token-audit.sh to lock the gain${NC}"
elif [ "$BDS_SELECTOR_COUNT" -eq 0 ]; then
  echo -e "  ${GREEN}Clean${NC}"
else
  echo -e "  ${DIM}${BDS_SELECTOR_COUNT} .bds-* selector(s) — at baseline; #221 BDS-issue queue must drain to lower it${NC}"
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
