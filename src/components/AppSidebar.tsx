'use client';

import { usePathname } from 'next/navigation';
import { SidebarNavigation } from '@bds/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTableColumns,
  faListCheck,
  faUsers,
  faCog,
} from '@fortawesome/free-solid-svg-icons';
import { color, font } from '@/lib/tokens';
import type { CSSProperties } from 'react';

const logoStyle: CSSProperties = {
  fontFamily: font.family.heading,
  fontSize: font.size.body.lg,
  fontWeight: font.weight.semibold,
  color: color.text.primary,
  letterSpacing: '-0.02em',
  margin: 0,
};


interface AppSidebarProps {
  userEmail?: string;
}

export function AppSidebar({ userEmail }: AppSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      active: pathname === '/dashboard',
      icon: <FontAwesomeIcon icon={faTableColumns} fixedWidth />,
    },
    {
      label: 'Tasks',
      href: '/tasks',
      active: pathname.startsWith('/tasks'),
      icon: <FontAwesomeIcon icon={faListCheck} fixedWidth />,
    },
    {
      label: 'Staff',
      href: '/staff',
      active: pathname.startsWith('/staff'),
      icon: <FontAwesomeIcon icon={faUsers} fixedWidth />,
    },
    {
      label: 'Settings',
      href: '/settings',
      active: pathname.startsWith('/settings'),
      icon: <FontAwesomeIcon icon={faCog} fixedWidth />,
    },
  ];

  return (
    <SidebarNavigation
      logo={<p style={logoStyle}>Renew PMS</p>}
      navItems={navItems}
      userSection={
        userEmail ? (
          <span style={{ fontSize: font.size.body.xs, color: color.text.muted }}>
            {userEmail}
          </span>
        ) : undefined
      }
    />
  );
}
