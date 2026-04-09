import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { ContactsTable } from './ContactsTable';

export default async function ContactsSettingsPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');
  if (authUser.profile.system_role === 'staff') redirect('/settings/account');

  return (
    <>
      <PageHeader title="Contacts" />
      <ContactsTable />
    </>
  );
}
