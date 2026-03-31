'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { InventoryTable } from '@/components/InventoryTable';

const TABS = [
  { key: 'equipment', label: 'Equipment' },
  { key: 'supplies', label: 'Supplies' },
];

export default function InventorySettingsPage() {
  const [activeTab, setActiveTab] = useState('equipment');

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Track clinical equipment, supplies, and assets across your practice."
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {activeTab === 'equipment' && <InventoryTable />}
      {activeTab === 'supplies' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          gap: 'var(--gap-lg)',
          padding: 'var(--padding-xl)',
          minHeight: '40vh',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: 'var(--heading-md)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
          }}>No Supplies Tracked Yet</h2>
          <p style={{
            fontFamily: 'var(--font-family-body)',
            fontSize: 'var(--body-md)',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            maxWidth: '400px',
            lineHeight: 'var(--font-line-height-normal)',
          }}>
            Track consumable supplies like PPE, instruments, disposables, and autoclave bags here.
          </p>
        </div>
      )}
    </>
  );
}
