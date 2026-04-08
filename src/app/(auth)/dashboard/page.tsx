import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');

  const { first_name, email } = authUser.profile;
  const displayName = first_name ?? email?.split('@')[0] ?? 'there';

  return <DashboardClient userName={displayName} />;
}
