import type { CSSProperties } from 'react';
import { color, font, space, gap, border } from '@/lib/tokens';

// ─── Shared settings page styles ─────────────────────────────────────────────
// All color/font references use BDS semantic tokens via @/lib/tokens.
// The active theme (theme-renew.css) provides the actual values.

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

export const sectionTitleStyle: CSSProperties = {
  fontFamily: font.family.heading,
  fontSize: font.size.heading.medium,
  fontWeight: font.weight.regular,
  lineHeight: 1,
  color: color.text.secondary,
  margin: 0,
  width: '100%',
};

export const rowStyle: CSSProperties = {
  display: 'flex',
  gap: space.lg,           // 24px
  alignItems: 'flex-start',
  width: '100%',
};

export const fieldStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: gap.md,             // 8px
  minWidth: 0,
};

export const labelStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.md,
  fontWeight: font.weight.medium,
  lineHeight: font.lineHeight.tight,
  color: color.text.primary,
};

export const valueStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  fontWeight: font.weight.regular,
  lineHeight: font.lineHeight.normal,
  color: color.text.secondary,
};


export const emptyFieldStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

export const statusBadgeBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: gap.sm,             // 6px
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.semibold,
  lineHeight: font.lineHeight.none,
  padding: `${gap.xs} ${space.xs}`, // 4px 10px
  borderRadius: border.radius.sm,   // 8px (closest named token to 6px)
};
