'use client';

import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import type { CSSProperties } from 'react';
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
  paddingInline: '32px',
  backgroundColor: 'var(--surface-primary)',
  borderBottom: '1px solid var(--border-muted)',
  flexShrink: 0,
  boxSizing: 'border-box',
  position: 'sticky',
  top: 0,
  zIndex: 50,
};

const leftStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-family-label)',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
  color: 'var(--text-secondary)',
  lineHeight: 1,
};

const greetingStyle: CSSProperties = {
  fontFamily: 'var(--font-family-label)',
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--text-primary)',
  lineHeight: 1.2,
};

const rightStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const bellStyle: CSSProperties = {
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '10px',
  backgroundColor: 'var(--surface-secondary)',
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
        <a href="/guide" style={bellStyle} aria-label="Help & User Guide">
          <FontAwesomeIcon icon={faCircleQuestion} style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 300 }} />
        </a>
        <button style={bellStyle} aria-label="Notifications">
          <FontAwesomeIcon icon={faBell} style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 300 }} />
        </button>
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
