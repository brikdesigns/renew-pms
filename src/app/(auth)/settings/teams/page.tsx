import { redirect } from 'next/navigation';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { TeamsSettingsClient } from './TeamsSettingsClient';

export default async function TeamsSettingsPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');
  if (!isAdmin(authUser.profile.system_role)) redirect('/settings/account');

  return <TeamsSettingsClient />;
}
