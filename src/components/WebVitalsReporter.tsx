'use client';

import { useReportWebVitals } from 'next/web-vitals';
import * as Sentry from '@sentry/nextjs';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // CLS is a unitless layout-shift score; everything else is in milliseconds.
    const unit = metric.name === 'CLS' ? 'none' : 'millisecond';
    Sentry.setMeasurement(metric.name, metric.value, unit);
  });

  return null;
}
