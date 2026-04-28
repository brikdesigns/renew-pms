'use client';

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { TabBar } from '@brikdesigns/bds';
import { font, color, gap, space } from '@/lib/tokens';

// ─── Styles (all via BDS semantic tokens) ────────────────────────────────────

function headerStyle(hasTabs: boolean): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: gap.xl,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: space.md,
    paddingBottom: hasTabs ? 0 : space.md,
    paddingInline: space.xl,
    borderBottom: `1px solid ${color.border.primary}`,
    width: '100%',
    boxSizing: 'border-box',
  };
}

const topRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
};

const titleStyle: CSSProperties = {
  fontFamily: font.family.heading,
  fontSize: font.size.heading.large,
  fontWeight: font.weight.regular,
  lineHeight: 1,
  color: color.text.primary,
  margin: 0,
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
};

// ─── Component ───────────────────────────────────────────────────────────────

export interface TabItem {
  key: string;
  label: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string | ReactNode;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
}

const breadcrumbBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.sm,
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.medium,
  lineHeight: font.lineHeight.tight,
};

const breadcrumbLinkStyle: CSSProperties = {
  color: color.text.secondary,
  textDecoration: 'none',
  cursor: 'pointer',
};

const breadcrumbCurrentStyle: CSSProperties = {
  color: color.text.primary,
};

const breadcrumbSepStyle: CSSProperties = {
  color: color.text.muted,
  userSelect: 'none',
};

const descriptionStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.secondary,
  lineHeight: font.lineHeight.normal,
  margin: 0,
  maxWidth: '600px',
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  tabs,
  activeTab,
  onTabChange,
}: PageHeaderProps) {
  const hasTabs = Boolean(tabs && tabs.length > 0);
  return (
    <header style={headerStyle(hasTabs)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav style={breadcrumbBarStyle} aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <span key={crumb.label} style={{ display: 'flex', alignItems: 'center', gap: gap.sm }}>
                {i > 0 && <span style={breadcrumbSepStyle}>/</span>}
                {crumb.href && !isLast ? (
                  <Link href={crumb.href} style={breadcrumbLinkStyle}>{crumb.label}</Link>
                ) : (
                  <span style={isLast ? breadcrumbCurrentStyle : breadcrumbLinkStyle}>{crumb.label}</span>
                )}
              </span>
            );
          })}
        </nav>
      )}
      <div style={topRowStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.sm }}>
          <h1 style={titleStyle}>{title}</h1>
          {description && <p style={descriptionStyle}>{description}</p>}
        </div>
        {actions && <div style={actionsStyle}>{actions}</div>}
      </div>
      {tabs && tabs.length > 0 && (
        <TabBar
          variant="text"
          items={tabs.map((tab) => ({
            label: tab.label,
            active: activeTab === tab.key,
            onClick: () => onTabChange?.(tab.key),
          }))}
        />
      )}
    </header>
  );
}
