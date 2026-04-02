'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faHouse,
  faCalendarDays,
  faListCheck,
  faFolderOpen,
  faChartColumn,
  faGraduationCap,
  faGear,
  faPowerOff,
  faMoon,
  faSun,
} from '@fortawesome/free-solid-svg-icons';
import type { SystemRole } from '@/lib/auth';
import type { CSSProperties } from 'react';
import { font, color } from '@/lib/tokens';
import { useTheme } from '@/hooks/useTheme';

// ─── Styles (using CSS vars from theme-renew.css) ────────────────────────────

const SIDEBAR_W = '80px';

const sidebarStyle: CSSProperties = {
  width: SIDEBAR_W,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: color.surface.nav,
  borderRight: `1px solid ${color.border.primary}`,
  height: '100dvh',
  position: 'sticky',
  top: 0,
  paddingBlock: '24px',
};

const topGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '48px',
  width: '100%',
};

const logoStyle: CSSProperties = {
  width: '41px',
  height: '41px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const diamondStyle: CSSProperties = {
  width: '29px',
  height: '29px',
  backgroundColor: color.background.inverse,
  borderRadius: '4px',
  transform: 'rotate(45deg)',
};

const navGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
};

function navItemStyle(active: boolean): CSSProperties {
  return {
    width: '100%',
    height: '52px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    padding: '10px',
    backgroundColor: active ? color.background.brandPrimary : 'transparent',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    boxSizing: 'border-box',
  };
}

const bottomGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
};

const bottomBtnStyle: CSSProperties = {
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '10px',
  backgroundColor: color.surface.secondary,
  flexShrink: 0,
  border: 'none',
  cursor: 'pointer',
};

// ─── Nav definition ──────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  icon: IconDefinition;
  label: string;
  match: (p: string) => boolean;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: faHouse, label: 'Dashboard', match: (p) => p === '/dashboard' || p === '/' },
  { href: '/schedule', icon: faCalendarDays, label: 'Schedule', match: (p) => p.startsWith('/schedule'), adminOnly: true },
  { href: '/tasks', icon: faListCheck, label: 'Tasks', match: (p) => p.startsWith('/tasks') },
  { href: '/training', icon: faGraduationCap, label: 'Training', match: (p) => p.startsWith('/training') },
  { href: '/documents', icon: faFolderOpen, label: 'Documents', match: (p) => p.startsWith('/documents'), adminOnly: true },
  { href: '/analytics', icon: faChartColumn, label: 'Analytics', match: (p) => p.startsWith('/analytics'), adminOnly: true },
  { href: '/settings', icon: faGear, label: 'Settings', match: (p) => p.startsWith('/settings') },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface AppSidebarProps {
  userRole?: SystemRole;
}

export function AppSidebar({ userRole = 'staff' }: AppSidebarProps) {
  const pathname = usePathname();
  const { isDark, toggle } = useTheme();
  const isAdmin = userRole === 'platform_admin' || userRole === 'practice_admin';

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside style={sidebarStyle}>
      <div style={topGroupStyle}>
        {/* Diamond logo */}
        <div style={logoStyle}>
          <div style={diamondStyle} />
        </div>

        {/* Nav icons */}
        <nav style={navGroupStyle}>
          {visibleItems.map((item) => {
            const active = item.match(pathname);
            return (
              <Link key={item.href} href={item.href} style={navItemStyle(active)} aria-label={item.label}>
                <FontAwesomeIcon
                  icon={item.icon}
                  fixedWidth
                  style={{
                    fontSize: font.size.body.xl,
                    color: active ? color.text.onColorDark : color.text.primary,
                    fontWeight: active ? 900 : 300,
                  }}
                />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom actions */}
      <div style={bottomGroupStyle}>
        <button onClick={toggle} style={bottomBtnStyle} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          <FontAwesomeIcon icon={isDark ? faSun : faMoon} fixedWidth style={{ fontSize: font.size.body.sm, color: color.text.primary }} />
        </button>
        <button style={bottomBtnStyle} aria-label="Log out">
          <FontAwesomeIcon icon={faPowerOff} fixedWidth style={{ fontSize: font.size.body.sm, color: color.text.primary }} />
        </button>
      </div>
    </aside>
  );
}
