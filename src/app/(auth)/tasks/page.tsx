import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';
import { createClient } from '@/lib/supabase/server';
import TasksClient from './TasksClient';
import { loadTasksPageData } from './loaders';

export default async function TasksPage() {
  const supabase = await createClient();
  const authUser = await getAuthUser(supabase);
  if (!authUser) redirect('/login');

  const role = authUser.profile.system_role;
  const canAddTask = role === 'brik_admin' || role === 'admin';
  const memberId = authUser.membership?.memberId ?? null;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) redirect('/');

  const todayStr = new Date().toISOString().slice(0, 10);
  const initialData = await loadTasksPageData(authUser, practiceId, todayStr);

  return (
    <TasksClient
      canAddTask={canAddTask}
      currentMemberId={memberId}
      initialData={initialData}
    />
  );
}
