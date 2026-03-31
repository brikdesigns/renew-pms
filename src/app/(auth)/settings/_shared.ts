import type { CSSProperties } from 'react';

// ─── Shared settings page styles ─────────────────────────────────────────────
// All color/font references use BDS semantic tokens via CSS vars.
// The active theme (theme-renew.css) provides the actual values.

export const settingsPlaceholderStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-family-body)',
  fontSize: 'var(--body-sm, 14px)',
};

export const contentStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '48px',
  alignItems: 'flex-start',
  paddingTop: '40px',
  paddingBottom: '80px',
  paddingInline: '32px',
};

export const sectionTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-family-heading)',
  fontSize: '25px',
  fontWeight: 400,
  lineHeight: 1,
  color: 'var(--text-secondary)',
  margin: 0,
  width: '100%',
};

export const rowStyle: CSSProperties = {
  display: 'flex',
  gap: '24px',
  alignItems: 'flex-start',
  width: '100%',
};

export const fieldStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  minWidth: 0,
};

export const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-family-label)',
  fontSize: 'var(--body-sm, 14px)',
  fontWeight: 500,
  lineHeight: '1.1',
  color: 'var(--text-primary)',
};

export const valueStyle: CSSProperties = {
  fontFamily: 'var(--font-family-body)',
  fontSize: 'var(--body-sm, 14px)',
  fontWeight: 400,
  lineHeight: '1.5',
  color: 'var(--text-secondary)',
};

export const editBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '40px',
  paddingInline: '16px',
  borderRadius: '8px',
  backgroundColor: 'var(--background-brand-primary)',
  color: 'var(--text-on-color-dark)',
  fontFamily: 'var(--font-family-label)',
  fontSize: 'var(--body-sm, 14px)',
  fontWeight: 800,
  border: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

export const emptyFieldStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

export const statusBadgeBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontFamily: 'var(--font-family-label)',
  fontSize: '13px',
  fontWeight: 600,
  lineHeight: '1',
  padding: '4px 10px',
  borderRadius: '6px',
};
