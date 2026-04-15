'use client';

import { Skeleton } from '@brikdesigns/bds';
import { color, gap, space, border } from '@/lib/tokens';

export default function TrainingLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${space.md} ${space.xl}`, borderBottom: `1px solid ${color.border.muted}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
          <Skeleton variant="rectangular" width={240} height={32} style={{ borderRadius: border.radius.sm }} />
          <Skeleton variant="text" width={32} height={20} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>
          <Skeleton variant="rectangular" width={120} height={28} style={{ borderRadius: border.radius.pill }} />
        </div>
      </div>
      {/* Card list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md, paddingBottom: space.lg }}>
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: gap.md,
              padding: space.md,
              borderRadius: border.radius.md,
              backgroundColor: color.surface.secondary,
            }}
          >
            <Skeleton variant="circular" width={40} height={40} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: gap.xs }}>
              <Skeleton variant="text" width={`${55 + (i % 3) * 12}%`} height={14} />
              <Skeleton variant="text" width={`${35 + (i % 2) * 15}%`} height={10} />
            </div>
            <Skeleton variant="rectangular" width={64} height={24} style={{ borderRadius: border.radius.pill }} />
          </div>
        ))}
      </div>
    </div>
  );
}
