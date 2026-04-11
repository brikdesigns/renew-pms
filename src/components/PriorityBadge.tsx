import { Badge } from '@bds/components';
import type { BadgeSize, BadgeVariant } from '@bds/components';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';

// ─── Priority vocabulary ────────────────────────────────────────────────────
// Single source of truth for priority → Badge variant + icon mapping.
// Never create local inline priority maps.

type BadgeStatus = 'positive' | 'warning' | 'error' | 'info';

const PRIORITIES: Record<string, { status: BadgeStatus; label: string; icon: string }> = {
  critical: { status: 'error',   label: 'Critical', icon: icon.priorityCritical },
  high:     { status: 'error',   label: 'High',     icon: icon.priorityHigh },
  medium:   { status: 'warning', label: 'Medium',   icon: icon.priorityWarning },
  low:      { status: 'info',    label: 'Low',      icon: icon.priorityInfo },
  // Aliases — task board uses badge status names as priority keys
  error:    { status: 'error',   label: 'High',     icon: icon.priorityHigh },
  warning:  { status: 'warning', label: 'Medium',   icon: icon.priorityWarning },
  info:     { status: 'info',    label: 'Low',      icon: icon.priorityInfo },
};

const FALLBACK = PRIORITIES.medium;

// ─── Component ──────────────────────────────────────────────────────────────

interface PriorityBadgeProps {
  /** Raw priority value from the database (critical, high, medium, low) */
  priority: string | null | undefined;
  /** Badge size */
  size?: BadgeSize;
  /** Badge visual variant */
  variant?: BadgeVariant;
  /** Show icon (default true) */
  showIcon?: boolean;
}

/**
 * Renders a priority level as a BDS Badge with status icon.
 *
 * This is the single source of truth for priority display — never create
 * local PRIORITY_MAP / PRIORITY_BADGE objects.
 *
 * @example
 * <PriorityBadge priority="critical" />
 * <PriorityBadge priority={task.priority} size="xs" />
 */
export function PriorityBadge({ priority, size = 'sm', variant = 'dark', showIcon = true }: PriorityBadgeProps) {
  if (!priority) return null;

  const resolved = PRIORITIES[priority] ?? FALLBACK;
  return (
    <Badge
      status={resolved.status}
      size={size}
      variant={variant}
      icon={showIcon ? <Icon icon={resolved.icon} /> : undefined}
    >
      {size === 'xs' ? undefined : resolved.label}
    </Badge>
  );
}
