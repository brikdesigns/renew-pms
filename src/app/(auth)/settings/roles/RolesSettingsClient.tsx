'use client';

import { useRef } from 'react';
import { Button, PageHeader } from '@brikdesigns/bds';
import { RolesTable, type RolesTableHandle } from './RolesTable';

/**
 * Client wrapper for /settings/roles. Hosts the "Add Role" action in the
 * BDS PageHeader actions slot. The EditRoleSheet stays inside RolesTable —
 * we trigger it via tableRef.openAddSheet().
 */
export function RolesSettingsClient() {
  const tableRef = useRef<RolesTableHandle>(null);

  return (
    <>
      <PageHeader
        title="Roles"
        actions={
          <Button variant="primary" size="sm" onClick={() => tableRef.current?.openAddSheet()}>
            Add Role
          </Button>
        }
      />
      <RolesTable ref={tableRef} />
    </>
  );
}
