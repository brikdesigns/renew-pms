'use client';

import { useState, type CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { Button, Tooltip } from '@brikdesigns/bds';
import { Logomark } from '@/components/Logomark';
import { font, color, motion, state, gap, space, border } from '@/lib/tokens';
import { useTheme } from '@/hooks/useTheme';

// ─── Styles (mirrors AppSidebar) ────────────────────────────────────────────

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
    border: 'none',
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

const profileCircleStyle: CSSProperties = {
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: border.radius.circle,
  backgroundColor: color.background.brandPrimary,
  color: color.text.onColorDark,
  fontSize: font.size.label.sm,
  fontFamily: font.family.label,
  fontWeight: 700,
  flexShrink: 0,
  cursor: 'default',
};

// ─── Nav items ──────────────────────────────────────────────────────────────

interface NavItemDef {
  id: string;
  icon: string;
  label: string;
}

const VENDOR_NAV: NavItemDef[] = [
  { id: 'work-order', icon: icon.requests, label: 'Work Order' },
  { id: 'profile',    icon: icon.profile,  label: 'Profile' },
];

// ─── Component ──────────────────────────────────────────────────────────────

interface VendorSidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  vendorContactName: string | null;
}

export function VendorSidebar({ activeSection, onNavigate, vendorContactName }: VendorSidebarProps) {
  const { isDark, toggle } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const initials = vendorContactName
    ? vendorContactName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside style={sidebarStyle}>
      <div style={topGroupStyle}>
        <div style={logoStyle} aria-label="Renew Dental">
          <Logomark size={40} />
        </div>

        <nav style={navGroupStyle}>
          {VENDOR_NAV.map((item) => {
            const active = activeSection === item.id;
            const hovered = hoveredItem === item.id;
            return (
              <Tooltip
                key={item.id}
                content={item.label}
                placement="right"
                delay={600}
                style={{ display: 'block', width: '100%' }}
              >
                <button
                  type="button"
                  style={navItemStyle(active, hovered)}
                  aria-label={item.label}
                  onClick={() => onNavigate(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Icon
                    icon={item.icon}
                    style={{
                      fontSize: font.size.body.xl,
                      color: navIconColor(active, hovered),
                    }}
                  />
                </button>
              </Tooltip>
            );
          })}
        </nav>
      </div>

      <div style={bottomGroupStyle}>
        {/* Theme toggle */}
        <Tooltip content={isDark ? 'Light mode' : 'Dark mode'} placement="right" delay={600}>
          <Button
            variant="secondary"
            size="sm"
            icon={<Icon icon={isDark ? icon.sun : icon.moon} />}
            label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggle}
          />
        </Tooltip>

        {/* Vendor avatar */}
        <Tooltip content={vendorContactName ?? 'Vendor'} placement="right" delay={600}>
          <div style={profileCircleStyle}>
            {initials}
          </div>
        </Tooltip>
      </div>
    </aside>
  );
}
