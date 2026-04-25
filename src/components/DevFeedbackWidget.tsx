'use client';

/**
 * Renew PMS wrapper around the canonical DevFeedbackWidget in @brikdesigns/bds.
 *
 * The full widget implementation lives in BDS — this wrapper supplies the
 * Renew-specific endpoint and the env gate that keeps the widget out of the
 * prod bundle.
 *
 * We defer mounting until BrikDevBar is present so the BDS widget's internal
 * devBarPresent check catches it synchronously on first render, preventing the
 * fallback FAB from ever entering the tree.
 */

import { useEffect, useState } from 'react';
import { DevFeedbackWidget as BdsDevFeedbackWidget } from '@brikdesigns/bds';

const SHOW_WIDGET =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === 'true';

export function DevFeedbackWidget() {
  const [barReady, setBarReady] = useState(false);

  useEffect(() => {
    if (!SHOW_WIDGET) return;
    if (typeof window === 'undefined') return;

    const iv = setInterval(() => {
      if (window.BrikDevBar) {
        setBarReady(true);
        clearInterval(iv);
      }
    }, 100);
    return () => clearInterval(iv);
  }, []);

  if (!SHOW_WIDGET || !barReady) return null;

  return (
    <BdsDevFeedbackWidget
      endpoint="/api/feedback"
      contextLabel="Page"
    />
  );
}
