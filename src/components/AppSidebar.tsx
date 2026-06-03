'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { Button, Menu, Tooltip } from '@brikdesigns/bds';
import type { MenuItemData } from '@brikdesigns/bds';
import { Logomark } from '@/components/Logomark';
import { UserAvatar } from '@/components/UserAvatar';
import { NotificationBell } from '@/components/NotificationBell';
import { createClient } from '@/lib/supabase/client';
import type { SystemRole } from '@/lib/auth';
import type { CSSProperties } from 'react';
import { font, color, motion, state, gap, space, border, shadow } from '@/lib/tokens';
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
  zIndex: 40,
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

// Sidebar dropdowns open to the right of the 80px sidebar instead of below.
// Avatar sits at the very bottom of the bottom group, so its menu floats up
// (bottom-aligned with the avatar). The bell sits above the avatar; its
// popover anchors to the bell's bottom so it grows upward and avoids the
// viewport floor.
const avatarMenuPosition: CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 'calc(100% + 8px)',
  minWidth: 220,
  zIndex: 100,
};

const notificationsPopoverPosition: CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 'calc(100% + 8px)',
  zIndex: 200,
};

// Practice-name header rendered above the menu items.
// FOLLOW-UP: brikdesigns/brik-bds#381 — once the `header` slot ships on
// <Menu>, drop this style + DOM node + stopPropagation handler and pass
// the practice name via the new prop. stopPropagation here keeps Menu's
// outside-click handler from closing the menu when the header is clicked.
const menuHeaderLabelStyle: CSSProperties = {
  padding: `${space.sm} ${space.md}`,
  borderBottom: `1px solid ${color.border.muted}`,
  fontFamily: font.family.label,
  fontSize: font.size.body.xs,
  fontWeight: 600,
  color: color.text.secondary,
  lineHeight: font.lineHeight.tight,
};

// Version footer rendered below the menu items. Informational only (not a
// menu item) — "Beta" is the product-stage label, the number is the clean
// semver build (NEXT_PUBLIC_APP_VERSION, wired from package.json in
// next.config.mjs). stopPropagation mirrors the header above so a click
// doesn't trip Menu's outside-click close. See renew-pms#248.
const menuVersionFooterStyle: CSSProperties = {
  padding: `${space.sm} ${space.md}`,
  borderTop: `1px solid ${color.border.muted}`,
  fontFamily: font.family.label,
  fontSize: font.size.body.xs,
  color: color.text.secondary,
  lineHeight: font.lineHeight.tight,
};

const accountWrapStyle: CSSProperties = {
  position: 'relative',
};

const menuFloatStyle: CSSProperties = {
  ...avatarMenuPosition,
  backgroundColor: color.surface.primary,
  border: `1px solid ${color.border.muted}`,
  borderRadius: border.radius.md,
  boxShadow: shadow.lg,
  overflow: 'hidden',
};

// Override BDS Menu's intrinsic floating chrome (background, shadow, radius,
// position) when nesting inside menuFloatStyle. The wrapper provides the
// visual container; Menu only contributes its item list + spacing.
const menuInsideWrapperStyle: CSSProperties = {
  position: 'static',
  boxShadow: 'none',
  borderRadius: 0,
  backgroundColor: 'transparent',
};

// ─── Nav definition ──────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  icon: string;
  label: string;
  match: (p: string) => boolean;
  /** Visible to practice admin (admin) and Brik staff (brik_admin). */
  adminOnly?: boolean;
  /** Visible only to Brik staff (brik_admin) — gates pre-launch features
   *  away from practice users until they are demo/client-ready. */
  platformAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: icon.home,      label: 'Dashboard', match: (p) => p === '/dashboard' || p === '/' },
  { href: '/schedule',  icon: icon.calendar,  label: 'Schedule',  match: (p) => p.startsWith('/schedule'), platformAdminOnly: true },
  { href: '/tasks',     icon: icon.tasks,     label: 'Tasks',     match: (p) => p.startsWith('/tasks') },
  { href: '/requests',  icon: icon.requests,  label: 'Requests',  match: (p) => p.startsWith('/requests') },
  { href: '/training',  icon: icon.training,  label: 'Training',  match: (p) => p.startsWith('/training'), platformAdminOnly: true },
  { href: '/documents', icon: icon.documents, label: 'Documents', match: (p) => p.startsWith('/documents'), platformAdminOnly: true },
  { href: '/analytics', icon: icon.analytics, label: 'Analytics', match: (p) => p.startsWith('/analytics'), platformAdminOnly: true },
  // Settings href overridden below for non-admin roles (staff/manager → account only)
  { href: '/settings',  icon: icon.settings,  label: 'Settings',  match: (p) => p.startsWith('/settings') },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface AppSidebarProps {
  userRole?: SystemRole;
  /** Display name (first name preferred). */
  userName?: string;
  /** Full name for avatar initials. */
  userFullName?: string;
  /** Department color key for avatar. */
  userDepartment?: string | null;
  /** Optional avatar image URL — falls back to initials. */
  userAvatarUrl?: string | null;
  /** Practice name shown as the avatar menu header. */
  practiceName?: string;
}

export function AppSidebar({
  userRole = 'staff',
  userName,
  userFullName,
  userDepartment,
  userAvatarUrl,
  practiceName,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggle } = useTheme();
  const isAdmin = userRole === 'brik_admin' || userRole === 'admin';
  const isPlatformAdmin = userRole === 'brik_admin';
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
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

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.platformAdminOnly && !isPlatformAdmin) return false;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  }).map((item) =>
    // Non-admins only have access to Account — skip the settings landing page
    item.label === 'Settings' && !isAdmin
      ? { ...item, href: '/settings/account' }
      : item
  );

  return (
    <aside style={sidebarStyle}>
      <div style={topGroupStyle}>
        {/* Logomark */}
        <Link href="/dashboard" style={logoStyle} aria-label="Dashboard">
          <Logomark size={40} />
        </Link>

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
                delay={600}
                style={{ display: 'block', width: '100%' }}
              >
                <Link
                  href={item.href}
                  style={navItemStyle(active, hovered)}
                  aria-label={item.label}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                  // BDS Tooltip shows on focus + hover. A click sets focus on the
                  // Link, and that focus persists across SPA navigation — so the
                  // tooltip pops up on the new page until something blurs the
                  // link (typically the user clicking somewhere in the body).
                  // Blur immediately after click to dismiss the tooltip; keyboard
                  // users still get it via Tab focus.
                  onClick={(e) => e.currentTarget.blur()}
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

      {/* Bottom actions — utilities first (help, theme), then identity (notifications, avatar). */}
      <div style={bottomGroupStyle}>
        <Tooltip content="Help & User Guide" placement="right" delay={600}>
          <Button
            variant="secondary"
            size="sm"
            icon={<Icon icon={icon.help} />}
            label="Help & User Guide"
            onClick={() => window.open('/guide', '_blank', 'noopener,noreferrer')}
          />
        </Tooltip>
        <Tooltip content={isDark ? 'Light mode' : 'Dark mode'} placement="right" delay={600}>
          <Button
            variant="secondary"
            size="sm"
            icon={<Icon icon={isDark ? icon.sun : icon.moon} />}
            label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggle}
          />
        </Tooltip>
        <Tooltip content="Notifications" placement="right" delay={600}>
          <NotificationBell dropdownPosition={notificationsPopoverPosition} />
        </Tooltip>
        <div style={accountWrapStyle}>
          <Button
            variant="ghost"
            size="md"
            label="User menu"
            onClick={() => setMenuOpen(prev => !prev)}
            icon={
              <UserAvatar
                name={userFullName ?? userName ?? '?'}
                departmentColorKey={userDepartment}
                avatarUrl={userAvatarUrl}
                size="md"
              />
            }
          />
          {menuOpen && (
            <div style={menuFloatStyle}>
              {practiceName && (
                <div
                  style={menuHeaderLabelStyle}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {practiceName}
                </div>
              )}
              <Menu
                items={menuItems}
                isOpen={true}
                onClose={() => setMenuOpen(false)}
                style={menuInsideWrapperStyle}
              />
              {appVersion && (
                <div
                  style={menuVersionFooterStyle}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  Beta · v{appVersion}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
