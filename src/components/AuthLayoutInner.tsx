'use client';

import { usePathname } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { space } from '@/lib/tokens';

const pageStyle: CSSProperties = {
  flex: 1,
  paddingTop: space.md,
  paddingLeft: space.xl,
  paddingRight: space.xl,
  paddingBottom: space.xl,
  overflowY: 'auto',
};

// Settings has its own scroll container (settings/layout.tsx bodyStyle).
// overflow: hidden here prevents a double scroll container that reveals
// the gray app-shell background behind the white settings body.
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
  overflowY: 'auto',
};

// Schedule: flex column so the calendar fills remaining height, with page padding.
// paddingBottom: 0 lets the calendar time grid bleed to the bottom edge.
const scheduleStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  paddingTop: space.md,
  paddingLeft: space.xl,
  paddingRight: space.xl,
  paddingBottom: 0,
};

// Tasks: board scrolls horizontally, so no right padding.
const tasksStyle: CSSProperties = {
  ...pageStyle,
  paddingRight: 0,
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
