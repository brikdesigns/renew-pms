import { Tag } from '@bds/components';
import { color } from '@/lib/tokens';
import { FREQUENCY_LABELS } from '@/lib/frequency-labels';

interface FrequencyTagProps {
  /** Raw frequency value from the database (e.g. 'daily', 'weekly') */
  value: string | null | undefined;
}

/**
 * Renders a frequency value inside a neutral BDS Tag.
 *
 * Use this everywhere a frequency is displayed — tables, sheets, page headers.
 * Returns null when the value is empty so callers can fall back to their own
 * empty-state rendering (em-dash, placeholder, etc.).
 */
export function FrequencyTag({ value }: FrequencyTagProps) {
  if (!value) return null;
  const label = FREQUENCY_LABELS[value] ?? value;
  return (
    <Tag size="sm" style={{ backgroundColor: color.background.secondary, color: color.text.secondary }}>
      {label}
    </Tag>
  );
}
