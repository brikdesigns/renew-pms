'use client';

import { useRef } from 'react';
import { Button, PageHeader } from '@brikdesigns/bds';
import { DepartmentsTable, type DepartmentsTableHandle } from './DepartmentsTable';

/**
 * Client wrapper for /settings/departments. Hosts the "Add Department"
 * action in the BDS PageHeader actions slot. The EditDepartmentSheet stays
 * inside DepartmentsTable — we trigger it via tableRef.openAddSheet().
 */
export function DepartmentsSettingsClient() {
  const tableRef = useRef<DepartmentsTableHandle>(null);

  return (
    <>
      <PageHeader
        title="Departments"
        actions={
          <Button variant="primary" size="sm" onClick={() => tableRef.current?.openAddSheet()}>
            Add Department
          </Button>
        }
      />
      <DepartmentsTable ref={tableRef} />
    </>
  );
}
