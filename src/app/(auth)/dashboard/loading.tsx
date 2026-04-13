'use client';

import { CardSkeleton } from '@/components/CardSkeleton';
import { color, gap, space, font, border } from '@/lib/tokens';
import { Skeleton } from '@bds/components';

const CARD_MIN_HEIGHT = '340px';

export default function DashboardLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xl }}>
      {/* Greeting */}
      <div>
        <Skeleton variant="text" width="280px" height={32} />
        <div style={{ marginTop: space.xs }}>
          <Skeleton variant="text" width="360px" height={16} />
        </div>
      </div>
      {/* Card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: gap.xl }}>
        <CardSkeleton variant="list" rows={4} minHeight={CARD_MIN_HEIGHT} />
        <CardSkeleton variant="stats" minHeight={CARD_MIN_HEIGHT} />
        <CardSkeleton variant="list" rows={4} minHeight={CARD_MIN_HEIGHT} />
        <CardSkeleton variant="list" rows={4} minHeight={CARD_MIN_HEIGHT} />
      </div>
    </div>
  );
}
