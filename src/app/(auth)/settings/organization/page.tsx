import { redirect } from 'next/navigation';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { OrganizationSettingsClient } from './OrganizationSettingsClient';

export default async function OrganizationSettingsPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');
  if (!isAdmin(authUser.profile.system_role)) redirect('/settings/account');

  return <OrganizationSettingsClient />;
}
