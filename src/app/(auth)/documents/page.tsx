'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';
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

const headingStyle: React.CSSProperties = {
  fontFamily: font.family.heading,
  fontSize: font.size.heading.medium,
  fontWeight: 700,
  color: color.text.primary,
  margin: 0,
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
    <div style={emptyStateStyle}>
      <FontAwesomeIcon icon={faFolderOpen} style={iconStyle as React.CSSProperties & Record<string, string>} />
      <h1 style={headingStyle}>Documents</h1>
      <p style={descStyle}>
        Document management is coming soon. You&apos;ll be able to access SOPs, compliance forms, and practice resources here.
      </p>
    </div>
  );
}
