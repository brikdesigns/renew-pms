/** Sentence-cased display labels for task frequency DB values. */
export const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  bi_weekly: 'Bi-Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semi_annually: 'Semi-Annually',
  annually: 'Annually',
  per_shift: 'Per Shift',
  custom: 'Custom',
};

/** Resolves a raw frequency value to its display label. */
export function frequencyLabel(raw: string | null | undefined): string {
  if (!raw) return '—';
  return FREQUENCY_LABELS[raw] ?? raw;
}
