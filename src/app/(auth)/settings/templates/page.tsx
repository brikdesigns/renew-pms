import { PageHeader } from '@/components/PageHeader';
import { TemplatesTable } from './TemplatesTable';

export default function TemplatesSettingsPage() {
  return (
    <>
      <PageHeader
        title="Templates"
        description="Create and manage task templates for checklists, procedures, compliance, and more."
      />
      <TemplatesTable />
    </>
  );
}
