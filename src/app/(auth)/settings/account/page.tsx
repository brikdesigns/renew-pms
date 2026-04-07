import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { AccountSettingsClient } from './AccountSettingsClient';

export default async function AccountSettingsPage() {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/login');
  }

  const { profile, membership } = authUser;
  const isAdmin = profile.system_role === 'platform_admin' || profile.system_role === 'practice_admin';

  return (
    <AccountSettingsClient
      profile={{
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        email: profile.email ?? '',
        phone: '',
        system_role: profile.system_role,
        practice_role: membership?.practice_role ?? '',
        practice_role_id: membership?.practice_role_id ?? '',
        department: membership?.department ?? '',
        team: '',
        organization: membership?.organization ?? '',
        start_date: membership?.joined_at?.slice(0, 10) ?? '',
        employee_type: membership?.employee_type ?? '',
        shift: membership?.shift ?? '',
      }}
      memberId={membership?.memberId ?? null}
      isAdmin={isAdmin}
    />
  );
}
