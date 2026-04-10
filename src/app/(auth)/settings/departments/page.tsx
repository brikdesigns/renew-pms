'use client';

import { PageHeader } from '@/components/PageHeader';
import { DepartmentsTable } from './DepartmentsTable';

export default function DepartmentsSettingsPage() {
  return (
    <>
      <PageHeader title="Departments" />
      <DepartmentsTable />
    </>
  );
}
