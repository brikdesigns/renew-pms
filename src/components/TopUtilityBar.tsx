'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import type { CSSProperties } from 'react';
import { font, color, gap, space, border } from '@/lib/tokens';
import { IconButton } from '@bds/components';
import { UserAvatar } from '@/components/UserAvatar';

// ─── Route label mapping ─────────────────────────────────────────────────────

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  tasks: 'Tasks',
  schedule: 'Schedule',
  documents: 'Documents',
  staff: 'Staff',
  training: 'Training',
  equipment: 'Equipment',
  settings: 'Settings',
};

function getPageLabel(pathname: string): string {
  const segment = pathname.split('/').filter(Boolean)[0] ?? 'dashboard';
  return ROUTE_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

// ─── Styles (BDS tokens) ────────────────────────────────────────────────────

const barStyle: CSSProperties = {
  width: '100%',
  height: '64px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingInline: space.xl,
  backgroundColor: color.surface.primary,
  borderBottom: `1px solid ${color.border.muted}`,
  flexShrink: 0,
  boxSizing: 'border-box',
  position: 'sticky',
  top: 0,
  zIndex: 50,
};

const leftStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.tiny,
};

const labelStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.body.xs,
  fontWeight: 600,
  textTransform: 'capitalize' as const,
  color: color.text.secondary,
  lineHeight: font.lineHeight.tight,
};

const greetingStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.body.xl,
  fontWeight: 700,
  color: color.text.primary,
  lineHeight: font.lineHeight.snug,
};

const rightStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: space.sm,
};

const bellStyle: CSSProperties = {
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: border.radius.md,
  backgroundColor: color.surface.secondary,
  flexShrink: 0,
  border: 'none',
  cursor: 'pointer',
};

// Avatar rendering moved to shared UserAvatar component

// ─── Component ───────────────────────────────────────────────────────────────

interface TopUtilityBarProps {
  userInitials?: string;
  userName?: string;
  /** Full name for avatar initials (e.g. "Sarah Mitchell") */
  userFullName?: string;
  /** Department name — drives avatar color */
  userDepartment?: string | null;
}

export function TopUtilityBar({ userInitials, userName, userFullName, userDepartment }: TopUtilityBarProps) {
  const pathname = usePathname();
  const pageLabel = getPageLabel(pathname);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = userName ?? 'there';

  return (
    <header style={barStyle}>
      <div style={leftStyle}>
        <span style={labelStyle}>{pageLabel}</span>
        <span style={greetingStyle}>{greeting}, {displayName}</span>
      </div>
      <div style={rightStyle}>
        <Link href="/guide" style={bellStyle} aria-label="Help & User Guide">
          <Icon icon={icon.help} style={{ fontSize: font.size.body.md, color: color.text.primary }} />
        </Link>
        <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.bell} />} label="Notifications" />
        <UserAvatar
          name={userFullName ?? userName ?? '?'}
          department={userDepartment}
          size="sm"
          shape="rounded"
          style={{ cursor: 'pointer' }}
        />
      </div>
    </header>
  );
}
