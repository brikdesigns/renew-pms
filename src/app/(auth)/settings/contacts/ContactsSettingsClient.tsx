'use client';

import { useRef, useState } from 'react';
import { Button, PageHeader, TabBar } from '@brikdesigns/bds';
import {
  ContactsTable,
  type ContactsTableHandle,
  RECORD_SEGMENTS,
  type RecordType,
} from './ContactsTable';

/**
 * Client wrapper for /settings/contacts. Hosts the segment-tab state and the
 * "Add Company" / "Add Contact" action that previously lived in
 * ContactsTable's sub-header. The sub-header is gone; segment lives in the
 * BDS PageHeader's `tabs` slot, the Add button lives in `actions` and switches
 * label per active tab. The Add sheets stay inside ContactsTable — we trigger
 * them via `tableRef.current.openAddCompany()` / `openAddContact()`.
 */
export function ContactsSettingsClient() {
  const [recordType, setRecordType] = useState<RecordType>('companies');
  const tableRef = useRef<ContactsTableHandle>(null);

  const handleAdd = () => {
    if (recordType === 'companies') {
      tableRef.current?.openAddCompany();
    } else {
      tableRef.current?.openAddContact();
    }
  };

  const addLabel = recordType === 'companies' ? 'Add Company' : 'Add Contact';

  return (
    <>
      <PageHeader
        title="Contacts"
        tabs={
          <TabBar
            variant="tab"
            items={RECORD_SEGMENTS.map((s) => ({
              label: s.label,
              active: recordType === s.value,
              onClick: () => setRecordType(s.value),
            }))}
          />
        }
        actions={
          <Button variant="primary" size="sm" onClick={handleAdd}>
            {addLabel}
          </Button>
        }
      />
      <ContactsTable ref={tableRef} recordType={recordType} />
    </>
  );
}
