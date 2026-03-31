import type { CSSProperties } from 'react';
import { font, color, gap, space, border } from '@/lib/tokens';

export const sheetBodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.xl,
};

export const sheetSectionTitle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.heading.small,
  fontWeight: 700,
  lineHeight: font.lineHeight.tight,
  color: color.text.primary,
  margin: 0,
};

export const sheetFormGroup: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.lg,
};

export const sheetFooterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: gap.lg,
  padding: space.lg,
  borderTop: `1px solid ${color.border.muted}`,
  flexShrink: 0,
};

export const cancelBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 'var(--space-1300)',
  paddingInline: space.xl,
  borderRadius: border.radius.sm,
  backgroundColor: 'transparent',
  color: color.text.primary,
  fontFamily: font.family.label,
  fontSize: font.size.body.md,
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
};

export const saveBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 'var(--space-1300)',
  paddingInline: space.xl,
  borderRadius: border.radius.sm,
  backgroundColor: color.background.brandPrimary,
  color: color.text.onColorDark,
  fontFamily: font.family.label,
  fontSize: font.size.body.md,
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
};
