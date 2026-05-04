import type { CSSProperties } from 'react';
import { color, font } from '@/lib/tokens';

// ─── Shared settings page styles ─────────────────────────────────────────────
// All color/font references use BDS semantic tokens via @/lib/tokens.
// The active theme (theme-renew.css) provides the actual values.
//
// Field-display helpers (fieldStyle, labelStyle, valueStyle, emptyFieldStyle,
// rowStyle, statusBadgeBase) were removed 2026-04-29 as part of the BDS
// Field/FieldGrid migration — see docs/qa/field-primitive-adoption-audit.md.
// Use BDS <Field> / <FieldGrid> directly at the call site.

export const settingsPlaceholderStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: color.text.secondary,
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
};

// Inter-section rhythm is owned by BDS DataSection's adjacent-sibling rule
// (`+ .bds-data-section { margin-top + padding-top + border-top }`). The
// previous `gap: space.huge` here stacked on top of that, producing ~110px
// between sections — sections felt detached while their interiors felt
// crammed. Letting DataSection own the rhythm gives the canonical
// 32px+divider+32px cadence from the BDS Form/Read-Mode Page pattern.
//
// `alignItems: stretch` lets each DataSection fill the column instead of
// hugging its narrowest child, so wide viewports use horizontal space.
export const contentStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
};
