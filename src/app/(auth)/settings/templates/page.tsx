import { redirect } from 'next/navigation';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { PageHeader } from '@brikdesigns/bds';
import { TemplatesTable } from './TemplatesTable';

export default async function TemplatesSettingsPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');
  if (!isAdmin(authUser.profile.system_role)) redirect('/settings/account');

  return (
    <>
      <PageHeader
        title="Templates"
        subtitle="Create and manage task templates for checklists, procedures, compliance, and more."
      />
      <TemplatesTable />
    </>
  );
}
