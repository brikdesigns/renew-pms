import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: 'https://ddd39f5d00a0927023422917cb94a5bd@o4511028166656000.ingest.us.sentry.io/4511028170391552',
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: 'https://ddd39f5d00a0927023422917cb94a5bd@o4511028166656000.ingest.us.sentry.io/4511028170391552',
    });
  }
}

// Automatically captures unhandled errors in App Router server components and API routes
export const onRequestError = Sentry.captureRequestError;
