import { Badge, Tooltip } from '@brikdesigns/bds';
import type { BadgeSize, BadgeAppearance } from '@brikdesigns/bds';
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

/** Card indicator size — matches Tag/Badge sm min-height for row alignment */
const CARD_INDICATOR_SIZE = 28;

// ─── Component ──────────────────────────────────────────────────────────────

interface PriorityBadgeProps {
  /** Raw priority value from the database (critical, high, medium, low) */
  priority: string | null | undefined;
  /** Badge size */
  size?: BadgeSize;
  /** Badge fill appearance */
  appearance?: BadgeAppearance;
  /** Show icon (default true) */
  showIcon?: boolean;
  /** Icon-only mode — square badge with tooltip. Defaults to true when size="xs". */
  iconOnly?: boolean;
}

/**
 * Renders a priority level as a BDS Badge with status icon.
 *
 * This is the single source of truth for priority display — never create
 * local PRIORITY_MAP / PRIORITY_BADGE objects.
 *
 * @example
 * <PriorityBadge priority="critical" />
 * <PriorityBadge priority={task.priority} iconOnly />
 */
export function PriorityBadge({ priority, size = 'sm', appearance = 'solid', showIcon = true, iconOnly }: PriorityBadgeProps) {
  if (!priority) return null;

  const resolved = PRIORITIES[priority] ?? FALLBACK;
  const isIconOnly = iconOnly ?? size === 'xs';
  const badge = (
    <Badge
      status={resolved.status}
      size={isIconOnly ? 'xs' : size}
      appearance={appearance}
      icon={showIcon ? <Icon icon={resolved.icon} /> : undefined}
      style={isIconOnly ? { width: CARD_INDICATOR_SIZE, height: CARD_INDICATOR_SIZE } : undefined}
    >
      {isIconOnly ? undefined : resolved.label}
    </Badge>
  );
  if (isIconOnly) {
    return <Tooltip content={`${resolved.label} Priority`} placement="top">{badge}</Tooltip>;
  }
  return badge;
}
