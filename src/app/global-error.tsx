'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect, type CSSProperties } from 'react';
import { Button } from '@brikdesigns/bds';
import './globals.css';
import { color, font, gap, space } from '@/lib/tokens';

const bodyStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100dvh',
  fontFamily: font.family.body,
};

const cardStyle: CSSProperties = {
  textAlign: 'center',
  maxWidth: '400px',
  padding: space.xl,
};

const headingStyle: CSSProperties = {
  fontFamily: font.family.heading,
  fontSize: font.size.heading.small,
  fontWeight: font.weight.bold,
  color: color.text.primary,
  marginBottom: gap.md,
};

const paragraphStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  color: color.text.secondary,
  marginBottom: gap.xl,
};

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
      <body className="theme-renew" style={bodyStyle}>
        <div style={cardStyle}>
          <h1 style={headingStyle}>Something went wrong</h1>
          <p style={paragraphStyle}>
            An unexpected error occurred. Our team has been notified.
          </p>
          <Button variant="secondary" size="sm" onClick={reset}>Try again</Button>
        </div>
      </body>
    </html>
  );
}
