'use client';

import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import type { CSSProperties } from 'react';
import { font, color, gap, space } from '@/lib/tokens';
import { IconButton } from '@bds/components';
import { UserAvatar } from '@/components/UserAvatar';
import { FeedbackButton } from '@/components/FeedbackButton';

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
  gap: gap.md,
};

// Avatar rendering moved to shared UserAvatar component

// ─── Component ───────────────────────────────────────────────────────────────

interface TopUtilityBarProps {
  userName?: string;
  /** Full name for avatar initials (e.g. "Sarah Mitchell") */
  userFullName?: string;
  /** Department name — drives avatar color */
  userDepartment?: string | null;
  userEmail?: string;
}

export function TopUtilityBar({ userName, userFullName, userDepartment, userEmail }: TopUtilityBarProps) {
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
        <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.help} />} label="Help & User Guide" onClick={() => window.open('/guide', '_blank', 'noopener,noreferrer')} />
        <FeedbackButton userEmail={userEmail} userName={userFullName ?? userName} />
        <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.bell} />} label="Notifications" />
        <UserAvatar
          name={userFullName ?? userName ?? '?'}
          departmentColorKey={userDepartment}
          size="md"
          shape="rounded"
          style={{ cursor: 'pointer' }}
        />
      </div>
    </header>
  );
}
