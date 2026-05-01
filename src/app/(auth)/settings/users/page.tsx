import { redirect } from 'next/navigation';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { PageHeader } from '@brikdesigns/bds';
import { UsersTable } from './UsersTable';

export default async function UsersSettingsPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');
  if (!isAdmin(authUser.profile.system_role)) redirect('/settings/account');

  return (
    <>
      <PageHeader title="Users" />
      <UsersTable />
    </>
  );
}
