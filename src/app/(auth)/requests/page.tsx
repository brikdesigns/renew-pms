import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import RequestsClient from './RequestsClient';
import { MyRequestsList } from './MyRequestsList';

export default async function RequestsPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');

  const role = authUser.profile.system_role;
  const canManageRequests = role === 'brik_admin' || role === 'admin' || role === 'manager';

  if (!canManageRequests) {
    const memberId = authUser.membership?.memberId;
    if (!memberId) redirect('/');
    return (
      <Suspense>
        <MyRequestsList memberId={memberId} />
      </Suspense>
    );
  }

  return (
    <Suspense>
      <RequestsClient isAdmin={canManageRequests} />
    </Suspense>
  );
}
