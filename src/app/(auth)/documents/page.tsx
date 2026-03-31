'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  gap: 'var(--gap-lg)',
  padding: 'var(--padding-xl)',
  minHeight: '60vh',
};

const iconStyle: React.CSSProperties = {
  fontSize: '48px',
  color: 'var(--text-muted)',
};

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-family-heading)',
  fontSize: 'var(--heading-md)',
  fontWeight: 700,
  color: 'var(--text-primary)',
  margin: 0,
};

const descStyle: React.CSSProperties = {
  fontFamily: 'var(--font-family-body)',
  fontSize: 'var(--body-md)',
  color: 'var(--text-secondary)',
  textAlign: 'center',
  maxWidth: '400px',
  lineHeight: 'var(--font-line-height-normal)',
};

export default function DocumentsPage() {
  return (
    <div style={emptyStateStyle}>
      <FontAwesomeIcon icon={faFolderOpen} style={iconStyle as React.CSSProperties & Record<string, string>} />
      <h1 style={headingStyle}>Documents</h1>
      <p style={descStyle}>
        Document management is coming soon. You'll be able to access SOPs, compliance forms, and practice resources here.
      </p>
    </div>
  );
}
