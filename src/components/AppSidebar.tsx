'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { Tooltip } from '@bds/components';
import { Logomark } from '@/components/Logomark';
import type { SystemRole } from '@/lib/auth';
import type { CSSProperties } from 'react';
import { font, color, motion, state, gap, space, border } from '@/lib/tokens';
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
  paddingBlock: space.lg,
};

const topGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: gap.section,
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


const navGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
};

function navItemStyle(active: boolean, hovered: boolean): CSSProperties {
  let backgroundColor: string;
  if (active) backgroundColor = color.background.brandPrimary;
  else if (hovered) backgroundColor = state.hover.subtle;
  else backgroundColor = 'transparent';

  return {
    width: '100%',
    height: '52px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    padding: space.xs,
    backgroundColor,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: `background-color ${motion.duration.fast} ${motion.ease.out}`,
    boxSizing: 'border-box',
  };
}

function navIconColor(active: boolean, hovered: boolean): string {
  if (active) return color.text.onColorDark;
  if (hovered) return color.text.brand;
  return color.text.primary;
}

const bottomGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: gap.lg,
};

function bottomBtnStyle(hovered: boolean): CSSProperties {
  return {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: border.radius.sm,
    backgroundColor: hovered ? state.hover.secondary : color.surface.secondary,
    flexShrink: 0,
    border: 'none',
    cursor: 'pointer',
    transition: `background-color ${motion.duration.fast} ${motion.ease.out}`,
  };
}

// ─── Nav definition ──────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  icon: string;
  label: string;
  match: (p: string) => boolean;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: icon.home,      label: 'Dashboard', match: (p) => p === '/dashboard' || p === '/' },
  { href: '/schedule',  icon: icon.calendar,  label: 'Schedule',  match: (p) => p.startsWith('/schedule'), adminOnly: true },
  { href: '/tasks',     icon: icon.tasks,     label: 'Tasks',     match: (p) => p.startsWith('/tasks') },
  { href: '/requests',  icon: icon.requests,  label: 'Requests',  match: (p) => p.startsWith('/requests') },
  { href: '/training',  icon: icon.training,  label: 'Training',  match: (p) => p.startsWith('/training') },
  { href: '/documents', icon: icon.documents, label: 'Documents', match: (p) => p.startsWith('/documents'), adminOnly: true },
  { href: '/analytics', icon: icon.analytics, label: 'Analytics', match: (p) => p.startsWith('/analytics'), adminOnly: true },
  { href: '/settings',  icon: icon.settings,  label: 'Settings',  match: (p) => p.startsWith('/settings') },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface AppSidebarProps {
  userRole?: SystemRole;
}

export function AppSidebar({ userRole = 'staff' }: AppSidebarProps) {
  const pathname = usePathname();
  const { isDark, toggle } = useTheme();
  const isAdmin = userRole === 'platform_admin' || userRole === 'practice_admin';
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoveredTheme, setHoveredTheme] = useState(false);
  const [hoveredHelp, setHoveredHelp] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside style={sidebarStyle}>
      <div style={topGroupStyle}>
        {/* Logomark */}
        <div style={logoStyle}>
          <Logomark size={40} />
        </div>

        {/* Nav icons */}
        <nav style={navGroupStyle}>
          {visibleItems.map((item) => {
            const active = item.match(pathname);
            const hovered = hoveredItem === item.href;
            return (
              <Tooltip
                key={item.href}
                content={item.label}
                placement="right"
                style={{ display: 'block', width: '100%' }}
              >
                <Link
                  href={item.href}
                  style={navItemStyle(active, hovered)}
                  aria-label={item.label}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Icon
                    icon={item.icon}
                    style={{
                      fontSize: font.size.body.xl,
                      color: navIconColor(active, hovered),
                    }}
                  />
                </Link>
              </Tooltip>
            );
          })}
        </nav>
      </div>

      {/* Bottom actions */}
      <div style={bottomGroupStyle}>
        <Tooltip content={isDark ? 'Light mode' : 'Dark mode'} placement="right">
          <button
            onClick={toggle}
            style={bottomBtnStyle(hoveredTheme)}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onMouseEnter={() => setHoveredTheme(true)}
            onMouseLeave={() => setHoveredTheme(false)}
          >
            <Icon icon={isDark ? icon.sun : icon.moon} style={{ fontSize: font.size.body.sm, color: color.text.primary }} />
          </button>
        </Tooltip>
        <Tooltip content="Help & User Guide" placement="right">
          <button
            onClick={() => window.open('/guide', '_blank', 'noopener,noreferrer')}
            style={bottomBtnStyle(hoveredHelp)}
            aria-label="Help & User Guide"
            onMouseEnter={() => setHoveredHelp(true)}
            onMouseLeave={() => setHoveredHelp(false)}
          >
            <Icon icon={icon.help} style={{ fontSize: font.size.body.sm, color: color.text.primary }} />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}
