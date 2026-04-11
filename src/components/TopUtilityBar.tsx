'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import type { CSSProperties } from 'react';
import { font, color, gap, space } from '@/lib/tokens';
import { IconButton, Menu, Tooltip } from '@bds/components';
import type { MenuItemData } from '@bds/components';
import { UserAvatar } from '@/components/UserAvatar';
import { FeedbackButton } from '@/components/FeedbackButton';
import { NotificationBell } from '@/components/NotificationBell';
import { createClient } from '@/lib/supabase/client';

// ─── Route label mapping ─────────────────────────────────────────────────────

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  tasks: 'Tasks',
  requests: 'Requests',
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

const avatarWrapStyle: CSSProperties = {
  position: 'relative',
};

const menuStyle: CSSProperties = {
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: 4,
  minWidth: 180,
  zIndex: 100,
};

// ─── Component ───────────────────────────────────────────────────────────────

interface TopUtilityBarProps {
  userName?: string;
  userFullName?: string;
  userDepartment?: string | null;
  userAvatarUrl?: string | null;
  userEmail?: string;
  practiceName?: string;
}

export function TopUtilityBar({ userName, userFullName, userDepartment, userAvatarUrl, userEmail, practiceName }: TopUtilityBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pageLabel = getPageLabel(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const menuItems: MenuItemData[] = [
    { id: 'profile', label: 'My Profile', onClick: () => { setMenuOpen(false); router.push('/settings/account'); } },
    { id: 'signout', label: 'Sign Out', onClick: handleLogout },
  ];

  return (
    <header style={barStyle}>
      <div style={leftStyle}>
        {practiceName && <span style={labelStyle}>{practiceName}</span>}
        <span style={greetingStyle}>{pageLabel}</span>
      </div>
      <div style={rightStyle}>
        <Tooltip content="Add Request" placement="bottom" delay={600}>
          <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.plus} />} label="New Request" onClick={() => router.push('/requests?submit=true')} />
        </Tooltip>
        <Tooltip content="Share Feedback" placement="bottom" delay={600}>
          <FeedbackButton userEmail={userEmail} userName={userFullName ?? userName} />
        </Tooltip>
        <Tooltip content="Notifications" placement="bottom" delay={600}>
          <NotificationBell />
        </Tooltip>
        <div style={avatarWrapStyle}>
          <button
            type="button"
            onClick={() => setMenuOpen(prev => !prev)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            aria-label="User menu"
          >
            <UserAvatar
              name={userFullName ?? userName ?? '?'}
              departmentColorKey={userDepartment}
              avatarUrl={userAvatarUrl}
              size="md"
            />
          </button>
          <Menu
            items={menuItems}
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            style={menuStyle}
          />
        </div>
      </div>
    </header>
  );
}
