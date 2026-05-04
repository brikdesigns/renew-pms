import { redirect } from 'next/navigation';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { DepartmentsSettingsClient } from './DepartmentsSettingsClient';

export default async function DepartmentsSettingsPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');
  if (!isAdmin(authUser.profile.system_role)) redirect('/settings/account');

  return <DepartmentsSettingsClient />;
}
