import type { CSSProperties } from 'react';
import { Avatar as BDSAvatar } from '@brikdesigns/bds';
import { font, color, border, departmentColor } from '@/lib/tokens';

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

// Renew avatar pixel sizes — BDS sm/lg map to renew md/lg directly, but
// renew sm (28) and 'button' (44, sm-icon-button-aligned) need overrides.
const SIZE_PIXELS: Record<AvatarSize, { dimension: string; fontSize: string }> = {
  sm:     { dimension: '28px', fontSize: font.size.body.xs },
  md:     { dimension: '40px', fontSize: font.size.body.sm },
  button: { dimension: '44px', fontSize: font.size.body.md },
  lg:     { dimension: '48px', fontSize: font.size.body.md },
};

/**
 * UserAvatar — Renew wrapper around BDS `<Avatar>`.
 *
 * Adds renew-specific behavior the BDS primitive doesn't carry:
 * - Department color theming (background + text from `departments.color`)
 * - No-department safe-contrast fallback per #170
 *   (`background.muted` + `text.primary` — ~18:1 light / ~20:1 dark)
 * - `button` size variant (44px) for sm-icon-button-aligned table rows
 * - `rounded` shape (10px radius) alongside default circle
 *
 * Tradeoff: BDS Avatar uses a raw `<img>` (no Next Image optimization).
 * Acceptable for 28–48px avatars. Initial-derivation also shifts from
 * "first letter of every word, sliced to 2" to BDS's "first + last word"
 * — for typical first-last names the result is identical.
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
  const { dimension, fontSize } = SIZE_PIXELS[size];

  let bg: string;
  let fg: string;
  if (departmentColorKey) {
    const deptColors = departmentColor(departmentColorKey);
    bg = deptColors.light;
    fg = deptColors.text;
  } else {
    bg = color.background.muted;
    fg = color.text.primary;
  }

  const borderRadius = shape === 'circle' ? border.radius.circle : '10px';

  return (
    <BDSAvatar
      name={name}
      src={avatarUrl ?? undefined}
      alt={name}
      style={{
        width: dimension,
        height: dimension,
        fontFamily: font.family.label,
        fontSize,
        fontWeight: font.weight.bold,
        backgroundColor: bg,
        color: fg,
        borderRadius,
        flexShrink: 0,
        ...styleProp,
      }}
    />
  );
}
