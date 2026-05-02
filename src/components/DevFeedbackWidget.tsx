'use client';

/**
 * Renew PMS wrapper around the canonical DevFeedbackWidget in @brikdesigns/bds.
 *
 * Two render modes, selected by env flag:
 *
 *   Slot mode (NEXT_PUBLIC_ENABLE_DEV_TOOLS=true or NODE_ENV=development)
 *     The widget registers as a slot inside BrikDevBar. We defer mounting
 *     until the bar is present so the BDS widget's internal devBarPresent
 *     check catches it on first render — prevents a brief FAB flash before
 *     the slot is reachable.
 *
 *   FAB mode (NEXT_PUBLIC_ENABLE_FEEDBACK_FAB=true, no DevBar)
 *     The widget renders immediately as a standalone floating action button.
 *     This is the customer-facing beta feedback path.
 */

import { useEffect, useState } from 'react';
import { DevFeedbackWidget as BdsDevFeedbackWidget } from '@brikdesigns/bds';

const SLOT_MODE =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === 'true';

const FAB_MODE =
  !SLOT_MODE && process.env.NEXT_PUBLIC_ENABLE_FEEDBACK_FAB === 'true';

export function DevFeedbackWidget() {
  const [barReady, setBarReady] = useState(false);

  useEffect(() => {
    if (!SLOT_MODE) return;
    if (typeof window === 'undefined') return;

    const iv = setInterval(() => {
      if (window.BrikDevBar) {
        setBarReady(true);
        clearInterval(iv);
      }
    }, 100);
    return () => clearInterval(iv);
  }, []);

  if (!SLOT_MODE && !FAB_MODE) return null;
  if (SLOT_MODE && !barReady) return null;

  return (
    <BdsDevFeedbackWidget
      endpoint="/api/feedback"
      contextLabel="Page"
    />
  );
}
