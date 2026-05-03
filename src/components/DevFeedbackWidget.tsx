'use client';

/**
 * Renew PMS wrapper around the canonical DevFeedbackWidget in @brikdesigns/bds.
 *
 * Two render modes, selected by env flag and asserted explicitly via the
 * BDS `variant` prop (shipped in @brikdesigns/bds@0.55.0, brik-bds#383):
 *
 *   Slot mode (NEXT_PUBLIC_ENABLE_DEV_TOOLS=true or NODE_ENV=development)
 *     `variant="slot"` — registers with BrikDevBar; the BDS widget seeds
 *     devBarPresent=true so no FAB flashes during shell load.
 *
 *   FAB mode (NEXT_PUBLIC_ENABLE_FEEDBACK_FAB=true, no DevBar)
 *     `variant="fab"` — renders the standalone floating action button
 *     directly. This is the customer-facing beta feedback path.
 */

import { DevFeedbackWidget as BdsDevFeedbackWidget } from '@brikdesigns/bds';

const SLOT_MODE =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === 'true';

const FAB_MODE =
  !SLOT_MODE && process.env.NEXT_PUBLIC_ENABLE_FEEDBACK_FAB === 'true';

export function DevFeedbackWidget() {
  if (!SLOT_MODE && !FAB_MODE) return null;

  return (
    <BdsDevFeedbackWidget
      variant={SLOT_MODE ? 'slot' : 'fab'}
      endpoint="/api/feedback"
      contextLabel="Page"
      // BDS default is bottom-left (next to a dev sidebar); renew pins to
      // bottom-right so it doesn't overlap AppSidebar chrome on the left.
      fabPosition={{ bottom: '16px', right: '16px' }}
    />
  );
}
