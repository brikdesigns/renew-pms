'use client';

import { PageHeader } from '@/components/PageHeader';
import { InventoryTable } from '@/components/InventoryTable';

export default function InventorySettingsPage() {
  return (
    <>
      <PageHeader title="Inventory" />
      <InventoryTable />
    </>
  );
}
