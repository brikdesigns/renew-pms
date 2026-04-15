'use client';

import { Skeleton } from '@brikdesigns/bds';
import { TableSkeleton } from '@/components/TableSkeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead } from '@brikdesigns/bds';
import { color, gap, space, border } from '@/lib/tokens';

export default function RequestsLoading() {
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
          <Skeleton variant="rectangular" width={100} height={28} style={{ borderRadius: border.radius.pill }} />
          <Skeleton variant="rectangular" width={120} height={32} style={{ borderRadius: border.radius.sm }} />
        </div>
      </div>
      {/* Table */}
      <div style={{ flex: 1, overflowX: 'auto', paddingInline: space.xl }}>
        <Table size="default" flush>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeleton columns={5} rows={8} />
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
