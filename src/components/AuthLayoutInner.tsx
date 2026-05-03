'use client';

import { usePathname } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { space } from '@/lib/tokens';

// Default page layout. Single source of truth for page-level horizontal inset
// after BDS 0.57.0 made <PageHeader> edge-to-edge — title, subtitle, body
// content, and the PageHeader bottom-divider all share `paddingInline: space.xl`
// so they line up at the same column. Vertical gap between PageHeader and body
// lives in this container's flex `gap`.
const pageStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: space.lg,
  paddingTop: space.md,
  paddingBottom: space.xl,
  paddingInline: space.xl,
  overflowY: 'auto',
};

// Settings has its own scroll container (settings/layout.tsx bodyStyle).
// overflow: hidden here prevents a double scroll container that reveals
// the gray app-shell background behind the white settings body.
// Horizontal inset is owned by settings/layout.tsx bodyStyle, not here.
const fullBleedSettingsStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

// Training detail has no outer scroll container — needs its own.
const fullBleedScrollStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  paddingInline: space.xl,
  overflowY: 'auto',
};

// Schedule: flex column so the calendar fills remaining height. Horizontal
// inset matches the rest of the app; `paddingBottom: 0` lets the calendar
// time grid bleed to the bottom edge.
const scheduleStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: space.lg,
  overflow: 'hidden',
  paddingTop: space.md,
  paddingBottom: 0,
  paddingInline: space.xl,
};

// Tasks + Requests: flex column so the board fills remaining height under the
// PageHeader. Horizontal inset matches the rest of the app; vertical gap
// between PageHeader and Board via flex `gap`.
const tasksStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: space.lg,
  overflow: 'hidden',
  paddingTop: space.md,
  paddingBottom: space.xl,
  paddingInline: space.xl,
};

interface AuthLayoutInnerProps {
  children: ReactNode;
}

export function AuthLayoutInner({ children }: AuthLayoutInnerProps) {
  const pathname = usePathname();
  const isSettings = pathname.startsWith('/settings');
  const isTrainingDetail = pathname.startsWith('/training/') && pathname !== '/training';
  const isTasks = pathname === '/tasks';
  const isRequests = pathname === '/requests';
  const isSchedule = pathname === '/schedule';

  const mainStyle = isSettings
    ? fullBleedSettingsStyle
    : isTrainingDetail
      ? fullBleedScrollStyle
    : isSchedule
      ? scheduleStyle
    : (isTasks || isRequests)
      ? tasksStyle
      : pageStyle;

  return (
    <main style={mainStyle}>
      {children}
    </main>
  );
}
