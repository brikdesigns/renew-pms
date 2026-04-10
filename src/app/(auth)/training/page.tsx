import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import TrainingClient from './TrainingClient';

export default async function TrainingPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');

  return (
    <TrainingClient
      systemRole={authUser.profile.system_role}
      currentMemberId={authUser.membership?.memberId ?? null}
      userDepartment={authUser.membership?.department ?? null}
    />
  );
}
