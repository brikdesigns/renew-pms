import * as Sentry from '@sentry/nextjs';

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  dsn: 'https://ddd39f5d00a0927023422917cb94a5bd@o4511028166656000.ingest.us.sentry.io/4511028170391552',
  integrations: [
    Sentry.feedbackIntegration({
      colorScheme: 'system',
      autoInject: false, // we use our own FeedbackButton, no floating widget
    }),
  ],
});
