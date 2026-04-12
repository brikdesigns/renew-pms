'use client';

import type { CSSProperties } from 'react';
import { Skeleton } from '@bds/components';
import { gap } from '@/lib/tokens';

/**
 * SheetSkeleton — shimmer loading placeholder for sheet body content.
 * Mimics the layout of a typical detail view (title, rows of fields, badges).
 */

const wrapStyle: CSSProperties = {
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

export function SheetSkeleton() {
  return (
    <div style={wrapStyle}>
      {/* Section title */}
      <Skeleton variant="text" width="120px" height={14} />

      {/* Two-column row */}
      <div style={rowStyle}>
        <div style={halfStyle}>
          <Skeleton variant="text" width="60px" height={10} />
          <Skeleton variant="text" width="100%" height={16} />
        </div>
        <div style={halfStyle}>
          <Skeleton variant="text" width="60px" height={10} />
          <Skeleton variant="text" width="80%" height={16} />
        </div>
      </div>

      {/* Two-column row with badges */}
      <div style={rowStyle}>
        <div style={halfStyle}>
          <Skeleton variant="text" width="50px" height={10} />
          <Skeleton variant="rectangular" width="80px" height={24} />
        </div>
        <div style={halfStyle}>
          <Skeleton variant="text" width="70px" height={10} />
          <Skeleton variant="rectangular" width="100px" height={24} />
        </div>
      </div>

      {/* Full-width field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.sm }}>
        <Skeleton variant="text" width="80px" height={10} />
        <Skeleton variant="text" width="100%" height={16} />
        <Skeleton variant="text" width="60%" height={16} />
      </div>

      {/* Another two-column row */}
      <div style={rowStyle}>
        <div style={halfStyle}>
          <Skeleton variant="text" width="55px" height={10} />
          <Skeleton variant="text" width="90%" height={16} />
        </div>
        <div style={halfStyle}>
          <Skeleton variant="text" width="40px" height={10} />
          <Skeleton variant="text" width="70%" height={16} />
        </div>
      </div>
    </div>
  );
}
