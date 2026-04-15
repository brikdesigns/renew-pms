'use client';

import type { CSSProperties } from 'react';
import { Skeleton } from '@brikdesigns/bds';
import { color, gap, space, border, shadow } from '@/lib/tokens';

// ─── Styles ─────────────────────────────────────────────────────────────────

const cardStyle: CSSProperties = {
  backgroundColor: color.background.primary,
  borderRadius: border.radius.lg,
  boxShadow: shadow.sm,
  padding: space.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: gap.lg,
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.md,
};

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
  padding: `${space.xs} ${space.sm}`,
  borderRadius: border.radius.md,
  backgroundColor: color.surface.secondary,
};

// ─── Variants ───────────────────────────────────────────────────────────────

/** Skeleton for a list card (overdue tasks, recent requests, onboarding) */
function ListCardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <Skeleton variant="text" width="180px" height={18} />
        <Skeleton variant="text" width="60px" height={14} />
      </div>
      <div style={listStyle}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} style={rowStyle}>
            <Skeleton variant="circular" width={32} height={32} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: gap.xs }}>
              <Skeleton variant="text" width={`${65 + (i % 3) * 10}%`} height={14} />
              <Skeleton variant="text" width={`${40 + (i % 2) * 15}%`} height={10} />
            </div>
            <Skeleton variant="rectangular" width={64} height={24} style={{ borderRadius: border.radius.pill }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for the progress/stats card */
function StatsCardSkeleton() {
  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <Skeleton variant="text" width="160px" height={18} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: space.xl }}>
        <Skeleton variant="circular" width={120} height={120} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: gap.sm }}>
              <Skeleton variant="text" width="48px" height={28} />
              <Skeleton variant="text" width="64px" height={10} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
        <Skeleton variant="text" width="100px" height={10} />
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
            <Skeleton variant="text" width="100px" height={12} />
            <Skeleton variant="text" width="100%" height={14} />
            <Skeleton variant="text" width="40px" height={12} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Exports ────────────────────────────────────────────────────────────────

interface CardSkeletonProps {
  /** Skeleton variant: 'list' for list-based cards, 'stats' for progress cards */
  variant?: 'list' | 'stats';
  /** Number of rows for list variant (default: 4) */
  rows?: number;
  /** Minimum height to match card layout */
  minHeight?: string;
}

export function CardSkeleton({ variant = 'list', rows = 4, minHeight }: CardSkeletonProps) {
  const wrapper: CSSProperties = minHeight ? { minHeight } : {};
  return (
    <div style={wrapper}>
      {variant === 'stats' ? <StatsCardSkeleton /> : <ListCardSkeleton rows={rows} />}
    </div>
  );
}
