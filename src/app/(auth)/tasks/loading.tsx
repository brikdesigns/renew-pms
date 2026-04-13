'use client';

import { Skeleton } from '@bds/components';
import { color, gap, space, border } from '@/lib/tokens';

export default function TasksLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Sub-header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${space.md} ${space.xl}`, borderBottom: `1px solid ${color.border.muted}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
          <Skeleton variant="rectangular" width={200} height={32} style={{ borderRadius: border.radius.sm }} />
          <Skeleton variant="text" width={32} height={20} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>
          <Skeleton variant="rectangular" width={100} height={28} style={{ borderRadius: border.radius.pill }} />
          <Skeleton variant="rectangular" width={120} height={32} style={{ borderRadius: border.radius.sm }} />
        </div>
      </div>
      {/* Board columns */}
      <div style={{ display: 'flex', gap: gap.lg, padding: space.xl, flex: 1 }}>
        {[0, 1, 2, 3].map((col) => (
          <div key={col} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: gap.md }}>
            <Skeleton variant="text" width="120px" height={16} />
            {Array.from({ length: 3 - (col % 2) }, (_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={100}
                style={{ borderRadius: border.radius.md }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
