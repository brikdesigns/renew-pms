'use client';

import { Suspense, type ReactNode } from 'react';
import { SheetStackProvider, SheetStackRenderer } from '@bds/components';
import { sheetComponents } from '@/lib/sheet-components';
import type { SheetType } from '@/lib/sheet-registry';
import { color, font } from '@/lib/tokens';

// ─── Loading fallback ───────────────────────────────────────────────────────

function SheetSkeleton() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      minHeight: '200px',
      fontFamily: font.family.body,
      fontSize: font.size.body.md,
      color: color.text.muted,
    }}>
      Loading...
    </div>
  );
}

// ─── Provider ───────────────────────────────────────────────────────────────

interface AppSheetProviderProps {
  children: ReactNode;
  /** User has admin/manager privileges — passed to all globally-rendered sheets */
  isAdmin?: boolean;
}

/**
 * AppSheetProvider — wires the BDS SheetStackProvider to the app's sheet registry.
 *
 * Place once in the auth layout. Renders the global sheet portal for the
 * navigation stack (view sheets opened from notifications, dashboard, etc.).
 */
export function AppSheetProvider({ children, isAdmin = false }: AppSheetProviderProps) {
  return (
    <SheetStackProvider>
      {children}
      <SheetStackRenderer
        width="600px"
        renderFrame={(frame, ctx) => {
          const Component = sheetComponents[frame.type as SheetType];
          if (!Component) {
            console.error(`[AppSheetProvider] No component for sheet type: ${frame.type}`);
            return null;
          }
          return (
            <Suspense fallback={<SheetSkeleton />}>
              <Component
                {...frame.props}
                isOpen
                isAdmin={isAdmin}
                onClose={ctx.closeAll}
                onNavigate={(type: string, props: Record<string, unknown>, opts?: { title?: string }) => {
                  ctx.pushSheet(type, props, opts);
                }}
              />
            </Suspense>
          );
        }}
      />
    </SheetStackProvider>
  );
}
