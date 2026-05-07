import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { AccountSettingsClient } from './AccountSettingsClient';

export default async function AccountSettingsPage() {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/login');
  }

  const { user, profile, membership } = authUser;
  const isAdmin = profile.system_role === 'brik_admin' || profile.system_role === 'admin';

  // SSO-only users (e.g. Google-only) have no 'email' identity, so they can't
  // change a password — manage at the IdP. Detect by enumerating linked
  // identities. Per #227 we surface a clear "manage in Google" message
  // instead of the password form for those accounts.
  const identities = user.identities ?? [];
  const hasEmailIdentity = identities.some((i) => i.provider === 'email');
  const ssoProviders = identities
    .filter((i) => i.provider !== 'email')
    .map((i) => i.provider);

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
        office_days: membership?.office_days ?? [],
      }}
      memberId={membership?.memberId ?? null}
      isAdmin={isAdmin}
      hasEmailIdentity={hasEmailIdentity}
      ssoProviders={ssoProviders}
    />
  );
}
