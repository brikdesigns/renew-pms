import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { AccountSettingsClient } from './AccountSettingsClient';

export default async function AccountSettingsPage() {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/login');
  }

  const { profile } = authUser;
  const isAdmin = profile.system_role === 'platform_admin' || profile.system_role === 'practice_admin';

  return (
    <AccountSettingsClient
      profile={{
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        email: profile.email ?? '',
        phone: '',           // TODO: add phone to getAuthUser select
        system_role: profile.system_role,
        practice_role: '',   // TODO: join practice_members → practice_role_types
        department: '',      // TODO: join practice_role_types → departments
        team: '',            // TODO: join teams table when available
        organization: '',    // TODO: join practices table
        start_date: '',      // TODO: practice_members.joined_at
        employee_status: '', // TODO: practice_members.employee_status
        shift: '',           // TODO: practice_members.shift
      }}
      isAdmin={isAdmin}
    />
  );
}
