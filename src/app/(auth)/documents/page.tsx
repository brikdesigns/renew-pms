'use client';

import { Icon } from '@iconify/react';
import { PageHeader } from '@brikdesigns/bds';
import { icon } from '@/lib/icons';
import { color, font, gap, space } from '@/lib/tokens';

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  gap: gap.lg,
  padding: space.xl,
  minHeight: '60vh',
};

const iconStyle: React.CSSProperties = {
  fontSize: font.size.heading.xLarge,
  color: color.text.muted,
};

const descStyle: React.CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.secondary,
  textAlign: 'center',
  maxWidth: '400px',
  lineHeight: font.lineHeight.normal,
};

export default function DocumentsPage() {
  return (
    <>
      <PageHeader title="Documents" />
      <div style={emptyStateStyle}>
        <Icon icon={icon.documents} style={iconStyle as React.CSSProperties & Record<string, string>} />
        <p style={descStyle}>
          Document management is coming soon. You&apos;ll be able to access SOPs, compliance forms, and practice resources here.
        </p>
      </div>
    </>
  );
}
