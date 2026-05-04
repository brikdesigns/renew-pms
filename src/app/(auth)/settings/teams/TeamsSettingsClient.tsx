'use client';

import { useRef } from 'react';
import { Button, PageHeader } from '@brikdesigns/bds';
import { TeamsTable, type TeamsTableHandle } from './TeamsTable';

/**
 * Client wrapper for /settings/teams. Hosts the "Add Team" action in the
 * BDS PageHeader actions slot. The EditTeamSheet stays inside TeamsTable —
 * we trigger it via tableRef.openAddSheet().
 */
export function TeamsSettingsClient() {
  const tableRef = useRef<TeamsTableHandle>(null);

  return (
    <>
      <PageHeader
        title="Teams"
        actions={
          <Button variant="primary" size="sm" onClick={() => tableRef.current?.openAddSheet()}>
            Add Team
          </Button>
        }
      />
      <TeamsTable ref={tableRef} />
    </>
  );
}
