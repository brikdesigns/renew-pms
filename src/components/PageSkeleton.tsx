'use client';

import type { CSSProperties } from 'react';
import { Skeleton } from '@brikdesigns/bds';
import { gap, space } from '@/lib/tokens';

/**
 * PageSkeleton — full-page shimmer loading placeholder.
 * Mimics a typical settings/detail page: heading + subtitle + content rows.
 */

const wrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.xl,
  padding: `${space.xl} ${space.xl}`,
  maxWidth: '800px',
};

const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.lg,
};

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: gap.lg,
  width: '100%',
};

const halfStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: gap.sm,
};

export function PageSkeleton() {
  return (
    <div style={wrapStyle}>
      {/* Page heading */}
      <Skeleton variant="text" width="220px" height={24} />

      {/* Section 1 */}
      <div style={sectionStyle}>
        <Skeleton variant="text" width="140px" height={14} />
        <div style={rowStyle}>
          <div style={halfStyle}>
            <Skeleton variant="text" width="80px" height={10} />
            <Skeleton variant="text" width="100%" height={16} />
          </div>
          <div style={halfStyle}>
            <Skeleton variant="text" width="60px" height={10} />
            <Skeleton variant="text" width="90%" height={16} />
          </div>
        </div>
        <div style={rowStyle}>
          <div style={halfStyle}>
            <Skeleton variant="text" width="70px" height={10} />
            <Skeleton variant="rectangular" width="100px" height={24} />
          </div>
          <div style={halfStyle}>
            <Skeleton variant="text" width="50px" height={10} />
            <Skeleton variant="rectangular" width="80px" height={24} />
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div style={sectionStyle}>
        <Skeleton variant="text" width="160px" height={14} />
        <Skeleton variant="text" width="100%" height={16} />
        <Skeleton variant="text" width="75%" height={16} />
        <Skeleton variant="text" width="85%" height={16} />
      </div>
    </div>
  );
}
