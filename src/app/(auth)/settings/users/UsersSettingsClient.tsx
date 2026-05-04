'use client';

import { useRef } from 'react';
import { Button, PageHeader } from '@brikdesigns/bds';
import { UsersTable, type UsersTableHandle } from './UsersTable';

/**
 * Client wrapper for /settings/users. Hosts the "Invite User" action in the
 * BDS PageHeader actions slot. The EditUserSheet stays inside UsersTable;
 * we trigger it via tableRef.openInviteSheet(). Filters live in a BDS
 * <FilterBar> rendered inside UsersTable, between PageHeader and the table.
 */
export function UsersSettingsClient() {
  const tableRef = useRef<UsersTableHandle>(null);

  return (
    <>
      <PageHeader
        title="Users"
        actions={
          <Button variant="primary" size="sm" onClick={() => tableRef.current?.openInviteSheet()}>
            Invite User
          </Button>
        }
      />
      <UsersTable ref={tableRef} />
    </>
  );
}
