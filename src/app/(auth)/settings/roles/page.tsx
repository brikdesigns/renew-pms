import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { RolesTable } from './RolesTable';

export default async function RolesSettingsPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');
  if (authUser.profile.system_role === 'staff') redirect('/settings/account');

  return (
    <>
      <PageHeader title="Roles" />
      <RolesTable />
    </>
  );
}
