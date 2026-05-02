import * as Sentry from '@sentry/nextjs';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseIntegration } from '@supabase/sentry-js-integration';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

/** Errors that are not actionable on the server — drop them before they count against quota. */
function beforeSendServer(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  const message = event.exception?.values?.[0]?.value ?? '';

  // CSS/PostCSS parsing errors from BDS components — build-time noise
  if (message.includes('PostCSS') || message.includes('CssSyntaxError')) return null;

  // Chunk load failures from stale deployments — user just needs a refresh
  if (message.includes('ChunkLoadError') || message.includes('Loading chunk')) return null;

  // NEXT_NOT_FOUND / NEXT_REDIRECT are control flow, not errors
  if (message.includes('NEXT_NOT_FOUND') || message.includes('NEXT_REDIRECT')) return null;

  return event;
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: SENTRY_DSN,
      enabled: process.env.NODE_ENV === 'production',
      environment: process.env.NEXT_PUBLIC_DEPLOY_ENVIRONMENT ?? process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
      beforeSend: beforeSendServer,
      integrations: [
        supabaseIntegration(SupabaseClient, Sentry, {
          tracing: true,
          breadcrumbs: true,
          errors: true,
        }),
      ],
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: SENTRY_DSN,
      enabled: process.env.NODE_ENV === 'production',
      environment: process.env.NEXT_PUBLIC_DEPLOY_ENVIRONMENT ?? process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
      beforeSend: beforeSendServer,
      integrations: [
        supabaseIntegration(SupabaseClient, Sentry, {
          tracing: true,
          breadcrumbs: true,
          errors: true,
        }),
      ],
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
