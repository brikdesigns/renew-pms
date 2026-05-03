import type { CSSProperties } from 'react';
import { color, font, space } from '@/lib/tokens';

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

export const contentStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: space.huge,         // 48px
  alignItems: 'flex-start',
  paddingTop: '40px',      // no exact BDS token (between space.xl=32px and space.huge=48px)
  paddingBottom: '80px',   // layout-specific, no BDS token
  paddingInline: space.xl, // 32px
};
