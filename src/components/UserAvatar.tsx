import type { CSSProperties } from 'react';
import { font, color, border } from '@/lib/tokens';
import { getDepartmentColors } from '@/lib/department-colors';

// ─── Types ───────────────────────────────────────────────────────────────────

type AvatarSize = 'sm' | 'md' | 'lg';

interface UserAvatarProps {
  /** Full name — used to derive initials */
  name: string;
  /** Department name — drives avatar color via department color map */
  department?: string | null;
  /** Optional image URL (takes priority over initials) */
  avatarUrl?: string | null;
  /** Size variant */
  size?: AvatarSize;
  /** Override border-radius (default: circle) */
  shape?: 'circle' | 'rounded';
  /** Additional inline styles */
  style?: CSSProperties;
}

// ─── Size map ────────────────────────────────────────────────────────────────

const SIZE_MAP: Record<AvatarSize, { dimension: string; fontSize: string }> = {
  sm: { dimension: '28px', fontSize: '11px' },
  md: { dimension: '40px', fontSize: '14px' },
  lg: { dimension: '48px', fontSize: '16px' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * UserAvatar — Consistent avatar rendering across the portal.
 *
 * Color logic (single source of truth):
 * 1. If `department` is provided → department light bg + department text color
 * 2. Fallback → brand primary bg + inverse text
 *
 * Used in: UsersTable, TopUtilityBar, ProfileCard, ViewUserSheet, etc.
 */
export function UserAvatar({
  name,
  department,
  avatarUrl,
  size = 'md',
  shape = 'circle',
  style: styleProp,
}: UserAvatarProps) {
  const { dimension, fontSize } = SIZE_MAP[size];

  // Resolve colors from department (or fall back to brand primary)
  let bg: string;
  let fg: string;

  if (department) {
    const deptColors = getDepartmentColors(department);
    bg = deptColors.light;
    fg = deptColors.text;
  } else {
    bg = color.background.brandPrimary;
    fg = color.text.inverse;
  }

  const baseStyle: CSSProperties = {
    width: dimension,
    height: dimension,
    borderRadius: shape === 'circle' ? border.radius.circle : '10px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontFamily: font.family.label,
    fontSize,
    fontWeight: font.weight.bold,
    lineHeight: 1,
    backgroundColor: bg,
    color: fg,
    ...styleProp,
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{
          ...baseStyle,
          objectFit: 'cover' as const,
        }}
      />
    );
  }

  return (
    <span style={baseStyle} aria-label={name}>
      {getInitials(name)}
    </span>
  );
}
