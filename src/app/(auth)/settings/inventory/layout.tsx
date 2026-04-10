import { redirect } from 'next/navigation';
import { getAuthUser, isAdmin } from '@/lib/auth';

export default async function InventoryGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');
  if (!isAdmin(authUser.profile.system_role)) redirect('/settings/account');

  return <>{children}</>;
}
