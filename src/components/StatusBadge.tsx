import { Badge } from '@brikdesigns/bds';
import type { BadgeSize, BadgeVariant } from '@brikdesigns/bds';

// ─── Status vocabularies ────────────────────────────────────────────────────
// Every entity status in the product maps to a BDS Badge variant here.
// Add new statuses to the relevant domain — never create local inline maps.

type BadgeStatus = 'positive' | 'warning' | 'error' | 'info';

/** Generic entity statuses (practice, templates, equipment, roles, departments) */
const ENTITY_STATUS: Record<string, { variant: BadgeStatus; label: string }> = {
  active:                  { variant: 'positive', label: 'Active' },
  inactive:                { variant: 'error',    label: 'Inactive' },
  draft:                   { variant: 'warning',  label: 'Draft' },
  archived:                { variant: 'error',    label: 'Archived' },
  suspended:               { variant: 'error',    label: 'Suspended' },
  needs_service:           { variant: 'warning',  label: 'Needs Service' },
  out_of_service:          { variant: 'error',    label: 'Out of Service' },
  renew_review:            { variant: 'warning',  label: 'Renew Review' },
  need_to_cancel_replace:  { variant: 'error',    label: 'Need to Cancel/Replace' },
  due_soon:                { variant: 'warning',  label: 'Due Soon' },
  upcoming:                { variant: 'info',     label: 'Upcoming' },
};

/** Request pipeline statuses */
const REQUEST_STATUS: Record<string, { variant: BadgeStatus; label: string }> = {
  submitted:         { variant: 'info',     label: 'Submitted' },
  in_review:         { variant: 'info',     label: 'In Review' },
  in_progress:       { variant: 'warning',  label: 'In Progress' },
  waiting_on_vendor: { variant: 'warning',  label: 'Waiting on Vendor' },
  resolved:          { variant: 'positive', label: 'Resolved' },
  closed:            { variant: 'positive', label: 'Closed' },
};

/** Task statuses */
const TASK_STATUS: Record<string, { variant: BadgeStatus; label: string }> = {
  not_started:        { variant: 'info',     label: 'Not Started' },
  in_progress:        { variant: 'warning',  label: 'In Progress' },
  awaiting_approval:  { variant: 'info',     label: 'Awaiting Approval' },
  completed:          { variant: 'positive', label: 'Completed' },
  blocked:            { variant: 'error',    label: 'Blocked' },
  skipped:            { variant: 'error',    label: 'Skipped' },
  overdue:            { variant: 'error',    label: 'Overdue' },
};

// ─── Merged lookup (entity statuses first, then domain-specific) ────────────

const ALL_STATUSES: Record<string, { variant: BadgeStatus; label: string }> = {
  ...TASK_STATUS,
  ...REQUEST_STATUS,
  ...ENTITY_STATUS, // entity wins on collisions (e.g. "active" is always positive)
};

const FALLBACK = { variant: 'info' as BadgeStatus, label: 'Unknown' };

/** Resolve a raw status string to its display label without rendering a Badge. */
export function statusLabel(status: string | null | undefined): string {
  if (!status) return '—';
  const key = status.toLowerCase().replace(/[\s/]+/g, '_');
  return ALL_STATUSES[key]?.label ?? ALL_STATUSES[status]?.label ?? status;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  /** Raw status value from the database */
  status: string | boolean | null | undefined;
  /** Override the display label (otherwise derived from status value) */
  label?: string;
  /** Badge size */
  size?: BadgeSize;
  /** Badge visual variant */
  variant?: BadgeVariant;
}

/**
 * Renders a status value as a BDS Badge (pill-shaped, state-based).
 *
 * Covers all entity, request, and task statuses in the product.
 * This is the single source of truth — never create inline status→color maps.
 *
 * @example
 * <StatusBadge status="active" />
 * <StatusBadge status={vendor.is_active} />
 * <StatusBadge status="in_review" size="sm" />
 */
export function StatusBadge({ status, label, size = 'sm', variant = 'dark' }: StatusBadgeProps) {
  // Boolean shorthand (is_active fields)
  if (typeof status === 'boolean') {
    const resolved = status ? ALL_STATUSES.active : ALL_STATUSES.inactive;
    return (
      <Badge status={resolved.variant} size={size} variant={variant}>
        {label ?? resolved.label}
      </Badge>
    );
  }

  if (!status) return null;

  // Normalize: "Renew Review" → "renew_review", "In Progress" → "in_progress"
  const key = status.toLowerCase().replace(/[\s/]+/g, '_');
  const resolved = ALL_STATUSES[key] ?? ALL_STATUSES[status] ?? FALLBACK;
  return (
    <Badge status={resolved.variant} size={size} variant={variant}>
      {label ?? resolved.label}
    </Badge>
  );
}
