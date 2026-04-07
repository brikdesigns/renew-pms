/* token-audit-ignore — error boundary uses hardcoded values; cannot depend on token system */
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect, type CSSProperties } from 'react';
import { Button } from '@bds/components';

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100%',
  padding: '48px 24px',
};

const cardStyle: CSSProperties = {
  textAlign: 'center',
  maxWidth: '400px',
};

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Something went wrong</h1>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
          An unexpected error occurred. Our team has been notified.
        </p>
        <Button variant="secondary" size="sm" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
