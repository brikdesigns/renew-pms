import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import RequestsClient from './RequestsClient';

export default async function RequestsPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');

  const role = authUser.profile.system_role;
  const isAdmin = role === 'platform_admin' || role === 'practice_admin';

  return <RequestsClient isAdmin={isAdmin} />;
}
