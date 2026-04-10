import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import TasksClient from './TasksClient';

export default async function TasksPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect('/login');

  const role = authUser.profile.system_role;
  const canAddTask = role === 'brik_admin' || role === 'admin';

  return <TasksClient canAddTask={canAddTask} />;
}
