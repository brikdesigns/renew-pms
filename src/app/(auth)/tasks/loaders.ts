import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveTaskScope } from '@/lib/task-scope';
import type { AuthUser } from '@/lib/auth';
import { loadTasks, type TaskRow } from '@/app/api/tasks/_helpers';
import { loadDepartments, type DepartmentRow } from '@/app/api/departments/_helpers';
import { loadMembers, type MemberRow } from '@/app/api/members/_helpers';

export interface TasksPageInitialData {
  tasks: TaskRow[];
  poolTasks: TaskRow[];
  departments: DepartmentRow[];
  members: MemberRow[];
}

/**
 * Server-side fan-out for the tasks page: runs the 4 dataset loads in
 * parallel using a single admin client. Replaces 4 separate API round-trips
 * (each paying its own cold-start + auth prelude) that the client component
 * used to make on mount.
 *
 * Scope resolution happens once and is shared between the assigned and pool
 * task loads, since both views are subject to the same caller visibility.
 */
export async function loadTasksPageData(
  authUser: AuthUser,
  practiceId: string,
  dateValue: string,
): Promise<TasksPageInitialData> {
  const admin = createAdminClient();
  const scope = await resolveTaskScope(admin, authUser, practiceId);

  const [tasks, poolTasks, departments, members] = await Promise.all([
    loadTasks(admin, practiceId, scope, dateValue, { pool: false }),
    loadTasks(admin, practiceId, scope, dateValue, { pool: true }),
    loadDepartments(admin, practiceId),
    loadMembers(admin, practiceId),
  ]);

  return { tasks, poolTasks, departments, members };
}
