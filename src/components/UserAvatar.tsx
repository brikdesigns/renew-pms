import type { CSSProperties } from 'react';
import Image from 'next/image';
import { font, color, border, departmentColor } from '@/lib/tokens';

// ─── Types ───────────────────────────────────────────────────────────────────

type AvatarSize = 'sm' | 'md' | 'lg' | 'button';

interface UserAvatarProps {
  /** Full name — used to derive initials */
  name: string;
  /** Department color key — stored on `departments.color` DB column (e.g. 'blue', 'green').
   *  Unknown keys fall back to blue. */
  departmentColorKey?: string | null;
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

const SIZE_MAP: Record<AvatarSize, { dimension: string; dimensionPx: number; fontSize: string }> = {
  sm:     { dimension: '28px', dimensionPx: 28, fontSize: font.size.body.xs },
  md:     { dimension: '40px', dimensionPx: 40, fontSize: font.size.body.sm },
  /** Matches sm IconButton min-height (44px) for table row alignment */
  button: { dimension: '44px', dimensionPx: 44, fontSize: font.size.body.md },
  lg:     { dimension: '48px', dimensionPx: 48, fontSize: font.size.body.md },
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
 * Used in: UsersTable, AppSidebar, ProfileCard, ViewUserSheet, etc.
 */
export function UserAvatar({
  name,
  departmentColorKey,
  avatarUrl,
  size = 'md',
  shape = 'circle',
  style: styleProp,
}: UserAvatarProps) {
  const { dimension, dimensionPx, fontSize } = SIZE_MAP[size];

  // Resolve colors from department (or fall back to brand primary)
  let bg: string;
  let fg: string;

  if (departmentColorKey) {
    const deptColors = departmentColor(departmentColorKey);
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
      <Image
        src={avatarUrl}
        alt={name}
        width={dimensionPx}
        height={dimensionPx}
        style={{
          ...baseStyle,
          objectFit: 'cover',
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
