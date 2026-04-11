'use client';

import { TableRow, TableCell, Skeleton } from '@bds/components';
import { gap } from '@/lib/tokens';

interface TableSkeletonProps {
  /** Number of columns to span */
  columns: number;
  /** Number of skeleton rows to render (default: 5) */
  rows?: number;
}

/**
 * TableSkeleton — shimmer loading rows for table bodies.
 * Renders N rows of skeleton cells that mimic the column layout.
 */
export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  // Vary widths per column position for visual realism
  const widthPattern = ['70%', '50%', '60%', '40%', '55%', '45%', '65%'];

  return (
    <>
      {Array.from({ length: rows }, (_, rowIdx) => (
        <TableRow key={rowIdx}>
          {Array.from({ length: columns }, (_, colIdx) => (
            <TableCell key={colIdx}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xs }}>
                <Skeleton
                  variant="text"
                  width={widthPattern[(rowIdx + colIdx) % widthPattern.length]}
                  height={14}
                />
              </div>
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
