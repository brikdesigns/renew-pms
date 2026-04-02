import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';

export default async function InventoryGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');
  if (authUser.profile.system_role === 'staff') redirect('/settings/account');

  return <>{children}</>;
}
