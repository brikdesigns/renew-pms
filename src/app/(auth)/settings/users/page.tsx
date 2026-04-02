import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { UsersTable } from './UsersTable';

export default async function UsersSettingsPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');
  if (authUser.profile.system_role === 'staff') redirect('/settings/account');

  return (
    <>
      <PageHeader title="Users" />
      <UsersTable />
    </>
  );
}
