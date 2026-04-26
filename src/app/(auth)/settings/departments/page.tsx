import { redirect } from 'next/navigation';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { DepartmentsTable } from './DepartmentsTable';

export default async function DepartmentsSettingsPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');
  if (!isAdmin(authUser.profile.system_role)) redirect('/settings/account');

  return (
    <>
      <PageHeader title="Departments" />
      <DepartmentsTable />
    </>
  );
}
