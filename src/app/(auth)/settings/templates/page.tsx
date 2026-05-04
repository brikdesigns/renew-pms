import { redirect } from 'next/navigation';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { TemplatesSettingsClient } from './TemplatesSettingsClient';

export default async function TemplatesSettingsPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');
  if (!isAdmin(authUser.profile.system_role)) redirect('/settings/account');

  return <TemplatesSettingsClient />;
}
