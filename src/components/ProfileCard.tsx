import type { CSSProperties, ReactNode } from 'react';
import { font, color, gap, border } from '@/lib/tokens';
import { UserAvatar } from '@/components/UserAvatar';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileCardBaseProps {
  name: string;
  subtitle?: string | null;
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

const cardStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '16px',
  borderRadius: border.radius.md,
  backgroundColor: color.surface.secondary,
};

// Avatar rendering moved to shared UserAvatar component

const dotStyle: CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '9999px',
  flexShrink: 0,
};

const textWrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
  flex: 1,
};

const nameStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  fontWeight: 800,
  color: color.text.primary,
  lineHeight: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const subtitleStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  fontWeight: 400,
  color: color.text.secondary,
  lineHeight: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

// ─── Component ───────────────────────────────────────────────────────────────

const deptTagStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.body.xs,
  fontWeight: 600,
  lineHeight: 1,
  padding: '4px 8px',
  borderRadius: border.radius.sm,
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

export function ProfileCard(props: ProfileCardProps) {
  const { variant, name, subtitle } = props;

  let visual: ReactNode;

  if (variant === 'department') {
    visual = <span style={{ ...dotStyle, backgroundColor: props.dotColor }} />;
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
        department={deptName}
        avatarUrl={url}
        size="md"
        style={styleOverrides}
      />
    );
  }

  // User variant: role • email subtitle + department tag
  if (variant === 'user') {
    const parts: string[] = [];
    if (props.role) parts.push(props.role);
    if (subtitle) parts.push(subtitle);
    const composedSubtitle = parts.length > 0 ? parts.join(' \u2022 ') : null;
    const hasDeptTag = props.department && props.departmentBg;

    return (
      <div style={cardStyle}>
        {visual}
        <div style={textWrap}>
          <span style={nameStyle}>{name}</span>
          {composedSubtitle && <span style={subtitleStyle}>{composedSubtitle}</span>}
        </div>
        {hasDeptTag && (
          <span style={{
            ...deptTagStyle,
            backgroundColor: props.departmentBg,
            color: props.departmentText ?? color.text.primary,
          }}>
            {props.department}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      {visual}
      <div style={textWrap}>
        <span style={nameStyle}>{name}</span>
        {subtitle && <span style={subtitleStyle}>{subtitle}</span>}
      </div>
    </div>
  );
}

// ─── Card grid container ─────────────────────────────────────────────────────

export const profileCardGrid: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.md,
};
