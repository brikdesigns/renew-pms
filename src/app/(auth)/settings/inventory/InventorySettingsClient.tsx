'use client';

import { useRef, useState } from 'react';
import { Button, PageHeader, TabBar } from '@brikdesigns/bds';
import {
  InventoryTable,
  type InventoryTableHandle,
  type InventoryView,
  INVENTORY_SEGMENTS,
} from '@/components/InventoryTable';

/**
 * Client wrapper for /settings/inventory. Hosts the Equipment / Supplies
 * tabs in the BDS PageHeader's tabs slot (replacing the previous in-table
 * SegmentedControl) and the "Add Item" action in the actions slot. The
 * EditInventorySheet stays inside InventoryTable; the parent triggers it
 * via tableRef.openAddSheet(). Filters live in a BDS <FilterBar> inside
 * InventoryTable, between PageHeader and the table.
 */
export function InventorySettingsClient() {
  const [view, setView] = useState<InventoryView>('equipment');
  const tableRef = useRef<InventoryTableHandle>(null);

  return (
    <>
      <PageHeader
        title="Inventory"
        tabs={
          <TabBar
            variant="tab"
            items={INVENTORY_SEGMENTS.map((s) => ({
              label: s.label,
              active: view === s.value,
              onClick: () => setView(s.value),
            }))}
          />
        }
        actions={
          view === 'equipment' ? (
            <Button variant="primary" size="sm" onClick={() => tableRef.current?.openAddSheet()}>
              Add Item
            </Button>
          ) : undefined
        }
      />
      <InventoryTable ref={tableRef} view={view} />
    </>
  );
}
