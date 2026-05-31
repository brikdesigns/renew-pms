import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatDueDate } from './date';

// Pin "today" to a known UTC date so tests are deterministic
const FAKE_TODAY = '2026-06-15';

function fakeNow(): number {
  return new Date(FAKE_TODAY + 'T12:00:00Z').getTime();
}

describe('formatDueDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function withFakeDate(fn: () => void) {
    vi.useFakeTimers();
    vi.setSystemTime(fakeNow());
    fn();
    vi.useRealTimers();
  }

  it('returns "Today" for the current date', () => {
    withFakeDate(() => {
      expect(formatDueDate(FAKE_TODAY)).toBe('Today');
    });
  });

  it('returns "Yesterday" for the date one day before today', () => {
    withFakeDate(() => {
      expect(formatDueDate('2026-06-14')).toBe('Yesterday');
    });
  });

  it('returns "Tomorrow" for the date one day after today', () => {
    withFakeDate(() => {
      expect(formatDueDate('2026-06-16')).toBe('Tomorrow');
    });
  });

  it('returns "MMM D" format for a past date further than one day ago', () => {
    withFakeDate(() => {
      expect(formatDueDate('2026-05-01')).toBe('May 1');
    });
  });

  it('returns "MMM D" format for a future date further than one day away', () => {
    withFakeDate(() => {
      expect(formatDueDate('2026-07-04')).toBe('Jul 4');
    });
  });

  it('handles month boundaries correctly', () => {
    withFakeDate(() => {
      // One day before FAKE_TODAY which is June 15 → June 14 = Yesterday
      expect(formatDueDate('2026-06-14')).toBe('Yesterday');
      // One day after → June 16 = Tomorrow
      expect(formatDueDate('2026-06-16')).toBe('Tomorrow');
    });
  });
});
