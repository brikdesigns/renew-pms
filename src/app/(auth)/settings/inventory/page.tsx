'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { InventoryTable } from '@/components/InventoryTable';
import { color, font, gap, space } from '@/lib/tokens';

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
          gap: gap.lg,
          padding: space.xl,
          minHeight: '40vh',
        }}>
          <h2 style={{
            fontFamily: font.family.heading,
            fontSize: font.size.heading.medium,
            fontWeight: font.weight.bold,
            color: color.text.primary,
            margin: 0,
          }}>No Supplies Tracked Yet</h2>
          <p style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.md,
            color: color.text.secondary,
            textAlign: 'center',
            maxWidth: '400px',
            lineHeight: font.lineHeight.normal,
          }}>
            Track consumable supplies like PPE, instruments, disposables, and autoclave bags here.
          </p>
        </div>
      )}
    </>
  );
}
