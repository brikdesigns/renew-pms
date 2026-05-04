'use client';

import { useRef, useState } from 'react';
import { Button, Menu, PageHeader, TabBar } from '@brikdesigns/bds';
import { Icon } from '@iconify/react';
import { gap } from '@/lib/tokens';
import { icon } from '@/lib/icons';
import {
  TemplatesTable,
  type TemplatesTableHandle,
  TEMPLATE_SEGMENTS,
  ADD_MENU_TYPES,
  SEGMENT_TYPES,
  type TemplateSegment,
} from './TemplatesTable';

/**
 * Client wrapper for /settings/templates. Hosts the segment-tab state and the
 * "Add Template" action that previously lived in TemplatesTable's sub-header.
 * The sub-header is gone; segment lives in the BDS PageHeader's `tabs` slot,
 * Add Template lives in `actions`. The EditTemplateSheet stays inside
 * TemplatesTable — we trigger it via `tableRef.current.openAddSheet(type)`.
 */
export function TemplatesSettingsClient() {
  const [segment, setSegment] = useState<TemplateSegment>('tasks');
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const tableRef = useRef<TemplatesTableHandle>(null);

  const filteredAddTypes = ADD_MENU_TYPES.filter((t) =>
    SEGMENT_TYPES[segment].includes(t.id),
  );

  const handleAddClick = (type: string) => {
    setAddMenuOpen(false);
    tableRef.current?.openAddSheet(type);
  };

  return (
    <>
      <PageHeader
        title="Templates"
        subtitle="Create and manage task templates for checklists, procedures, compliance, and more."
        tabs={
          <TabBar
            variant="tab"
            items={TEMPLATE_SEGMENTS.map((s) => ({
              label: s.label,
              active: segment === s.value,
              onClick: () => setSegment(s.value),
            }))}
          />
        }
        actions={
          <div style={{ position: 'relative' }}>
            <Button
              variant="primary"
              size="sm"
              iconAfter={<Icon icon={icon.chevronDown} />}
              onClick={() => setAddMenuOpen((p) => !p)}
            >
              Add Template
            </Button>
            <Menu
              isOpen={addMenuOpen}
              onClose={() => setAddMenuOpen(false)}
              items={filteredAddTypes.map((t) => ({
                id: t.id,
                label: t.label,
                description: t.desc,
                icon: <Icon icon={t.icon} />,
                onClick: () => handleAddClick(t.id),
              }))}
              style={{ top: '100%', right: 0, marginTop: gap.sm, minWidth: 240 }}
            />
          </div>
        }
      />
      <TemplatesTable ref={tableRef} segment={segment} />
    </>
  );
}
