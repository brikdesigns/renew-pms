'use client';

import dynamic from 'next/dynamic';
import { BrikDevBar } from '@brikdesigns/bds';

// Two independent gates so the bundles only ship to surfaces that need them:
//
//   NEXT_PUBLIC_ENABLE_DEV_TOOLS=true   → full DevBar + persona switcher + feedback (slot mode)
//                                         For local dev + staging context only.
//
//   NEXT_PUBLIC_ENABLE_FEEDBACK_FAB=true → ONLY the feedback widget, rendered as a
//                                          standalone floating action button.
//                                          For production beta — collects customer feedback
//                                          without exposing internal tooling.
//
// process.env.NEXT_PUBLIC_* values are inlined at build time, so the conditional
// short-circuits and dead branches are tree-shaken from the prod bundle.

const SHOW_DEV_TOOLS =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === 'true';

const SHOW_FEEDBACK_FAB = process.env.NEXT_PUBLIC_ENABLE_FEEDBACK_FAB === 'true';

const DevPersonaSwitcher = dynamic(
  () => import('./DevPersonaSwitcher').then((m) => m.DevPersonaSwitcher),
  { ssr: false },
);

const DevFeedbackWidget = dynamic(
  () => import('./DevFeedbackWidget').then((m) => m.DevFeedbackWidget),
  { ssr: false },
);

export function DevTools() {
  if (!SHOW_DEV_TOOLS && !SHOW_FEEDBACK_FAB) return null;

  return (
    <>
      {SHOW_DEV_TOOLS && (
        <>
          {/* DevBar shell — widgets below register into it via useDevBarSlot. */}
          <BrikDevBar />
          <DevPersonaSwitcher />
        </>
      )}
      {(SHOW_DEV_TOOLS || SHOW_FEEDBACK_FAB) && <DevFeedbackWidget />}
    </>
  );
}
