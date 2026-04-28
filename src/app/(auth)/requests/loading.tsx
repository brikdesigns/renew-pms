'use client';

import { Skeleton } from '@brikdesigns/bds';
import { color, gap, space, border } from '@/lib/tokens';

// Shape-neutral chrome shown only while page.tsx awaits getAuthUser().
// Each role-branched component (RequestsClient as Board / MyRequestsList as
// Table) renders its own body skeleton during data fetch, so the wrong shape
// never flashes between auth-resolve and data-load.
export default function RequestsLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: space.xl }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${space.md} 0`,
          borderBottom: `1px solid ${color.border.muted}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
          <Skeleton variant="rectangular" width={120} height={20} style={{ borderRadius: border.radius.sm }} />
          <Skeleton variant="text" width={28} height={20} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>
          <Skeleton variant="rectangular" width={120} height={28} style={{ borderRadius: border.radius.pill }} />
          <Skeleton variant="rectangular" width={120} height={28} style={{ borderRadius: border.radius.pill }} />
          <Skeleton variant="rectangular" width={130} height={32} style={{ borderRadius: border.radius.sm }} />
        </div>
      </div>
    </div>
  );
}
