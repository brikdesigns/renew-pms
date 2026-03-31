import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { TeamsTable } from './TeamsTable';

export default async function TeamsSettingsPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');
  if (authUser.profile.system_role === 'staff') redirect('/settings/account');

  return (
    <>
      <PageHeader title="Teams" />
      <TeamsTable />
    </>
  );
}
