import { redirect } from 'next/navigation';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { TeamsTable } from './TeamsTable';

export default async function TeamsSettingsPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');
  if (!isAdmin(authUser.profile.system_role)) redirect('/settings/account');

  return (
    <>
      <PageHeader title="Teams" />
      <TeamsTable />
    </>
  );
}
