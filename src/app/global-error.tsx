/* token-audit-ignore — global error boundary renders outside React tree; hardcoded values required */
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import './globals.css';

export default function GlobalError({
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
    <html lang="en">
      <body className="theme-renew" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '32px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Something went wrong</h1>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            style={{ padding: '8px 20px', fontSize: '14px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
