'use client';

import dynamic from 'next/dynamic';
import { BrikDevBar } from '@brikdesigns/bds';

// Dev-only widgets loaded via next/dynamic with ssr:false so the JS only
// ships when the env flag turns them on. Both components gate internally on
// NEXT_PUBLIC_ENABLE_DEV_TOOLS and render null in prod — this wrapper keeps
// their JS out of the prod bundle as well.
const DevPersonaSwitcher = dynamic(
  () => import('./DevPersonaSwitcher').then((m) => m.DevPersonaSwitcher),
  { ssr: false },
);

const DevFeedbackWidget = dynamic(
  () => import('./DevFeedbackWidget').then((m) => m.DevFeedbackWidget),
  { ssr: false },
);

export function DevTools() {
  return (
    <>
      {/* DevBar shell — widgets below register into it via useDevBarSlot. */}
      <BrikDevBar />
      <DevPersonaSwitcher />
      <DevFeedbackWidget />
    </>
  );
}
