import { redirect } from 'next/navigation';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { PageHeader } from '@brikdesigns/bds';
import { InventoryTable } from '@/components/InventoryTable';

export default async function InventorySettingsPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');
  if (!isAdmin(authUser.profile.system_role)) redirect('/settings/account');

  return (
    <>
      <PageHeader title="Inventory" />
      <InventoryTable />
    </>
  );
}
