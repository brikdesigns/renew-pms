import * as Sentry from '@sentry/nextjs';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseIntegration } from '@supabase/sentry-js-integration';

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

/** Client-side noise filter — drops errors that aren't actionable bugs. */
function beforeSendClient(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  const message = event.exception?.values?.[0]?.value ?? '';

  // Browser extensions inject errors we can't fix
  const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];
  if (frames.some((f) => f.filename?.includes('chrome-extension://') || f.filename?.includes('moz-extension://'))) {
    return null;
  }

  // ResizeObserver noise — benign browser implementation detail
  if (message.includes('ResizeObserver')) return null;

  // Chunk load failures from stale deploys — user just needs a refresh
  if (message.includes('ChunkLoadError') || message.includes('Loading chunk')) return null;

  // Network errors the user caused by navigating away
  if (message.includes('AbortError') || message.includes('The user aborted a request')) return null;

  // CSS parsing errors from dev builds
  if (message.includes('PostCSS') || message.includes('CssSyntaxError')) return null;

  return event;
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NEXT_PUBLIC_DEPLOY_ENVIRONMENT ?? process.env.NODE_ENV,

  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  beforeSend: beforeSendClient,

  integrations: [
    supabaseIntegration(SupabaseClient, Sentry, {
      tracing: true,
      breadcrumbs: true,
      errors: true,
    }),
    Sentry.feedbackIntegration({
      colorScheme: 'system',
      autoInject: false,
    }),
    Sentry.replayIntegration(),
  ],

  // Don't record replays for normal sessions — only when an error happens
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});
