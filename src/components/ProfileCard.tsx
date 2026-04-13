import { useState, type CSSProperties, type ReactNode } from 'react';
import { font, color, space, gap, border, state, motion } from '@/lib/tokens';
import { UserAvatar } from '@/components/UserAvatar';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileCardBaseProps {
  name: string;
  subtitle?: string | null;
  /** When provided, the card becomes a clickable link to the related record */
  onClick?: () => void;
  /** Custom trailing content — replaces the default department tag when provided */
  endContent?: ReactNode;
  /** Avatar size override (default: 'md') */
  avatarSize?: 'sm' | 'md' | 'lg';
}

interface UserCardProps extends ProfileCardBaseProps {
  variant: 'user';
  avatarUrl?: string;
  role?: string;
  department?: string;
  departmentBg?: string;
  departmentText?: string;
}

interface RoleCardProps extends ProfileCardBaseProps {
  variant: 'role';
  avatarUrl?: string;
  /** Department color for avatar background (derived via role → department FK) */
  departmentBg?: string;
  departmentText?: string;
}

interface DepartmentCardProps extends ProfileCardBaseProps {
  variant: 'department';
  dotColor: string;
}

interface TeamCardProps extends ProfileCardBaseProps {
  variant: 'team';
  avatarUrl?: string;
}

export type ProfileCardProps =
  | UserCardProps
  | RoleCardProps
  | DepartmentCardProps
  | TeamCardProps;

// ─── Styles ──────────────────────────────────────────────────────────────────

function cardStyle(clickable: boolean, hovered: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: gap.md,
    padding: space.md,
    borderRadius: border.radius.md,
    backgroundColor: hovered ? state.hover.secondary : color.surface.secondary,
    cursor: clickable ? 'pointer' : undefined,
    transition: `background-color ${motion.duration.fast} ${motion.ease.out}`,
    border: 'none',
    textAlign: 'left',
    width: '100%',
  };
}

// Avatar rendering moved to shared UserAvatar component

const dotStyle: CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: border.radius.pill,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: font.family.label,
  fontSize: font.size.label.md,
  fontWeight: font.weight.bold,
  color: color.text.primary,
};

const textWrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.tiny,
  minWidth: 0,
  flex: 1,
};

const nameStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.md,
  fontWeight: font.weight.bold,
  color: color.text.primary,
  lineHeight: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const subtitleStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.regular,
  color: color.text.secondary,
  lineHeight: 1.3,
  overflowWrap: 'break-word',
};

// ─── Component ───────────────────────────────────────────────────────────────

const deptTagStyle: CSSProperties = {
  fontFamily: font.family.subtitle,
  fontSize: font.size.subtitle.md,
  fontWeight: font.weight.semibold,
  lineHeight: 1,
  padding: `${gap.xs} ${gap.md}`,
  borderRadius: border.radius.sm,
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

export function ProfileCard(props: ProfileCardProps) {
  const { variant, name, subtitle, onClick, endContent, avatarSize = 'md' } = props;
  const [hovered, setHovered] = useState(false);
  const clickable = !!onClick;
  const Tag = clickable ? 'button' : 'div';

  let visual: ReactNode;

  if (variant === 'department') {
    const initial = name.charAt(0).toUpperCase();
    visual = <span style={{ ...dotStyle, backgroundColor: props.dotColor }}>{initial}</span>;
  } else {
    const url = props.avatarUrl;
    // Role + user cards: resolve department from user variant's department prop,
    // or fall back to explicit departmentBg/departmentText style overrides
    const deptName = variant === 'user' ? props.department : undefined;
    const hasDeptColor = (variant === 'role' || variant === 'user') && 'departmentBg' in props && props.departmentBg;
    const styleOverrides: React.CSSProperties | undefined = hasDeptColor
      ? {
          backgroundColor: props.departmentBg,
          color: ('departmentText' in props && props.departmentText) ? props.departmentText : undefined,
        }
      : undefined;

    visual = (
      <UserAvatar
        name={name}
        departmentColorKey={deptName}
        avatarUrl={url}
        size={avatarSize}
        style={styleOverrides}
      />
    );
  }

  // User variant: role • email subtitle + department tag
  if (variant === 'user') {
    const parts: string[] = [];
    if (props.role) parts.push(props.role);
    if (subtitle) parts.push(subtitle.toLowerCase());
    const composedSubtitle = parts.length > 0 ? parts.join(' \u2022 ') : null;
    const hasDeptTag = props.department && props.departmentBg;

    return (
      <Tag
        type={clickable ? 'button' : undefined}
        style={cardStyle(clickable, hovered)}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {visual}
        <div style={textWrap}>
          <span style={nameStyle}>{name}</span>
          {composedSubtitle && <span style={subtitleStyle}>{composedSubtitle}</span>}
        </div>
        {endContent ?? (hasDeptTag && (
          <span style={{
            ...deptTagStyle,
            backgroundColor: props.departmentBg,
            color: props.departmentText ?? color.text.primary,
          }}>
            {props.department}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag
      type={clickable ? 'button' : undefined}
      style={cardStyle(clickable, hovered)}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {visual}
      <div style={textWrap}>
        <span style={nameStyle}>{name}</span>
        {subtitle && <span style={subtitleStyle}>{subtitle}</span>}
      </div>
    </Tag>
  );
}

// ─── Card grid container ─────────────────────────────────────────────────────

export const profileCardGrid: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.md,
};
