/**
 * Format a YYYY-MM-DD due date into a human-readable label relative to today.
 *
 * Dates are compared as UTC midnight to avoid timezone-offset drift (the
 * due_date column is a plain `date`, not a timestamptz).
 */
export function formatDueDate(dueDate: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const dueUTC = new Date(dueDate + 'T00:00:00Z').getTime();
  const todayUTC = new Date(today + 'T00:00:00Z').getTime();
  const diffDays = Math.round((dueUTC - todayUTC) / 86_400_000);

  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(dueDate + 'T00:00:00Z'),
  );
}
