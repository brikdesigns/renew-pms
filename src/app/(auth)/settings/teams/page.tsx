'use client';

import { PageHeader } from '@/components/PageHeader';
import { TeamsTable } from './TeamsTable';

export default function TeamsSettingsPage() {
  return (
    <>
      <PageHeader title="Teams" />
      <TeamsTable />
    </>
  );
}
