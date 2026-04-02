'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faUser,
  faBuilding,
  faClipboardList,
  faBoxArchive,
  faUsers,
  faUserShield,
  faUserPlus,
  faWarehouse,
} from '@fortawesome/free-solid-svg-icons';
import type { CSSProperties } from 'react';
import { font, color, border } from '@/lib/tokens';

// ─── Styles (BDS tokens) ────────────────────────────────────────────────────

const SUB_NAV_W = '194px';

const subNavStyle: CSSProperties = {
  width: SUB_NAV_W,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  backgroundColor: color.surface.secondary,
  borderRight: `1px solid ${color.border.muted}`,
  height: '100%',
  paddingInline: '12px',
  paddingTop: '113px',
  overflowY: 'auto',
  boxSizing: 'border-box',
};

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
  flex: 1,
  width: '100%',
};

function menuItemStyle(active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingBlock: '12px',
    paddingInline: '12px',
    width: '100%',
    borderRadius: border.radius.sm,
    backgroundColor: active ? color.background.brandPrimary : 'transparent',
    color: active ? color.text.onColorDark : color.text.primary,
    textDecoration: 'none',
    fontFamily: font.family.label,
    fontSize: font.size.body.md,
    fontWeight: 500,
    lineHeight: font.lineHeight.tight,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, color 0.15s ease',
    boxSizing: 'border-box',
  };
}

const iconStyle: CSSProperties = {
  width: '16px',
  height: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontSize: font.size.body.sm,
};

// ─── Nav items definition ────────────────────────────────────────────────────

export interface SettingsNavItem {
  href: string;
  icon: IconDefinition;
  label: string;
  adminOnly: boolean;
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { href: '/settings/account', icon: faUser, label: 'Account', adminOnly: false },
  { href: '/settings/organization', icon: faBuilding, label: 'Organization', adminOnly: true },
  { href: '/settings/templates', icon: faClipboardList, label: 'Templates', adminOnly: true },
  { href: '/settings/departments', icon: faBoxArchive, label: 'Departments', adminOnly: true },
  { href: '/settings/teams', icon: faUsers, label: 'Teams', adminOnly: true },
  { href: '/settings/roles', icon: faUserShield, label: 'Roles', adminOnly: true },
  { href: '/settings/users', icon: faUserPlus, label: 'Users', adminOnly: true },
  { href: '/settings/inventory', icon: faWarehouse, label: 'Inventory', adminOnly: true },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface SettingsSubNavProps {
  userRole?: 'platform_admin' | 'practice_admin' | 'staff';
}

export function SettingsSubNav({ userRole = 'staff' }: SettingsSubNavProps) {
  const pathname = usePathname();
  const isAdmin = userRole === 'platform_admin' || userRole === 'practice_admin';

  const visibleItems = SETTINGS_NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <nav style={subNavStyle} aria-label="Settings navigation">
      <div style={listStyle}>
        {visibleItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={menuItemStyle(active)}>
              <span style={iconStyle}>
                <FontAwesomeIcon icon={item.icon} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
