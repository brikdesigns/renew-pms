'use client';

import { Suspense, useMemo, type ReactNode } from 'react';
import { SheetStackProvider, SheetStackRenderer } from '@bds/components';
import { sheetComponents } from '@/lib/sheet-components';
import type { SheetType } from '@/lib/sheet-registry';
import { SheetSkeleton } from '@/components/SheetSkeleton';

// ─── Provider ───────────────────────────────────────────────────────────────

interface AppSheetProviderProps {
  children: ReactNode;
  /** User has admin/manager privileges — passed to all globally-rendered sheets */
  isAdmin?: boolean;
  /** Current user's practice_members.id — used for assignee checks in sheets */
  currentMemberId?: string;
}

/**
 * AppSheetProvider — wires the BDS SheetStackProvider to the app's sheet registry.
 *
 * Place once in the auth layout. SheetStackRenderer renders a single persistent
 * Sheet panel. View components use `useConfigureSheet()` to declare their
 * title, tabs, and footer — the Sheet never closes/reopens during navigation.
 */
export function AppSheetProvider({ children, isAdmin = false, currentMemberId }: AppSheetProviderProps) {
  const globalFrameProps = useMemo(() => ({ isAdmin, currentMemberId }), [isAdmin, currentMemberId]);

  return (
    <SheetStackProvider>
      {children}
      <SheetStackRenderer
        globalFrameProps={globalFrameProps}
        renderFrame={(frame, ctx) => {
          const Component = sheetComponents[frame.type as SheetType];
          if (!Component) {
            console.error(`[AppSheetProvider] No component for sheet type: ${frame.type}`);
            return null;
          }
          return (
            <Suspense fallback={<SheetSkeleton />}>
              <Component
                {...ctx.globalFrameProps}
                {...frame.props}
                headless
                onClose={ctx.closeAll}
                onNavigate={ctx.pushSheet}
              />
            </Suspense>
          );
        }}
      />
    </SheetStackProvider>
  );
}
