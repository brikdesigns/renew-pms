import type { CSSProperties } from 'react';
import { font, color, gap, space } from '@/lib/tokens';

export const sheetBodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.xl,
};

export const sheetSectionTitle: CSSProperties = {
  fontFamily: font.family.heading,
  fontSize: font.size.heading.small,
  fontWeight: font.weight.bold,
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
