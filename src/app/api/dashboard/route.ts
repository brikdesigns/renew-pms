import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';
import { resolveTaskScope, buildVisibilityOr } from '@/lib/task-scope';

// ─── Types ──────────────────────────────────────────────────────────────────

type ProfileJoin = { first_name: string; last_name: string };
type DepartmentJoin = { name: string; color: string };
type RoleJoin = { name: string; departments: DepartmentJoin | DepartmentJoin[] | null };
type MemberJoin = {
  id: string;
  profiles: ProfileJoin | ProfileJoin[] | null;
  practice_role_types: RoleJoin | RoleJoin[] | null;
};

interface RawOverdueTask {
  id: string;
  title: string;
  priority: string;
  assigned_to: string | null;
  assigned_role_id: string | null;
  assigned_department: string | null;
  departments: DepartmentJoin | DepartmentJoin[] | null;
  practice_members: MemberJoin | MemberJoin[] | null;
  assigned_role: RoleJoin | RoleJoin[] | null;
}

function first<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

// ─── GET /api/dashboard ─────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const scope = await resolveTaskScope(admin, authUser, practiceId);
  const visibilityOr = buildVisibilityOr(scope);

  // ── 1. Overdue tasks (6 most recent by due_date) ───────────────────────────
  // Includes assigned_role_id + the role FK join so role-assigned overdue
  // tasks render with the role name (and the role's department) instead of
  // silently collapsing to "Unassigned" with no department.
  let overdueQuery = admin
    .from('tasks')
    .select(`
      id, title, priority, due_date, assigned_to, assigned_role_id, assigned_department,
      departments!tasks_assigned_department_fkey(name, color),
      practice_members(
        id,
        profiles(first_name, last_name),
        practice_role_types(name, departments(name, color))
      ),
      assigned_role:practice_role_types!tasks_assigned_role_id_fkey(name, departments(name, color))
    `)
    .eq('practice_id', practiceId)
    .eq('status', 'overdue');
  if (visibilityOr !== null) overdueQuery = overdueQuery.or(visibilityOr);
  const { data: rawOverdue, error: overdueErr } = await overdueQuery
    .order('due_date', { ascending: false })
    .limit(6);

  if (overdueErr) return apiError(overdueErr);

  const overdueTasks = (rawOverdue ?? []).map((t: RawOverdueTask) => {
    const member = first(t.practice_members);
    const profile = member ? first(member.profiles) : null;
    const memberRole = member ? first(member.practice_role_types) : null;
    const memberRoleDept = memberRole ? first(memberRole.departments) : null;
    const assignedRole = first(t.assigned_role);
    const assignedRoleDept = assignedRole ? first(assignedRole.departments) : null;
    const taskDept = first(t.departments);

    // Assignee label: discriminate by which FK is set on the task. Role and
    // department assignments aren't "Unassigned" — they're assigned to a group.
    let assignee: string;
    if (profile) {
      assignee = `${profile.first_name} ${profile.last_name}`;
    } else if (assignedRole) {
      assignee = assignedRole.name;
    } else if (taskDept && t.assigned_department) {
      assignee = taskDept.name;
    } else {
      assignee = 'Pool';
    }
    // Department for the chip: prefer the task's explicit department, then the
    // assigned role's department, then the assignee member's role department.
    const dept = taskDept ?? assignedRoleDept ?? memberRoleDept;

    return {
      id: t.id,
      title: t.title,
      priority: t.priority,
      assignee,
      dept: dept?.name ?? '',
      deptColor: dept?.color ?? '',
    };
  });

  // ── 2. Today's progress (all tasks due today or overdue) ──────────────────
  // Selects assigned_role_id + the role FK join so role-assigned tasks resolve
  // to the role's department and count toward the right "Today's Progress"
  // bucket. Without this, role-only tasks silently drop out of the aggregation.
  let todayQuery = admin
    .from('tasks')
    .select(`
      id, status, assigned_department, assigned_role_id,
      departments!tasks_assigned_department_fkey(name, color),
      practice_members(practice_role_types(departments(name, color))),
      assigned_role:practice_role_types!tasks_assigned_role_id_fkey(departments(name, color))
    `)
    .eq('practice_id', practiceId)
    .or(`due_date.eq.${today},status.eq.overdue,and(frequency.in.(daily,per_shift),due_date.lte.${today},status.neq.completed,status.neq.skipped)`);
  if (visibilityOr !== null) todayQuery = todayQuery.or(visibilityOr);
  const { data: todayTasks, error: todayErr } = await todayQuery.limit(500);

  if (todayErr) return apiError(todayErr);

  // Deduplicate
  const seen = new Set<string>();
  const uniqueToday = (todayTasks ?? []).filter((t: { id: string }) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  let todayCompleted = 0;
  const todayTotal = uniqueToday.length;
  const deptCounts: Record<string, { completed: number; total: number; color: string }> = {};

  type AssignedRoleJoin = { departments: DepartmentJoin | DepartmentJoin[] | null };

  for (const t of uniqueToday) {
    const isCompleted = t.status === 'completed' || t.status === 'skipped';
    if (isCompleted) todayCompleted++;

    // Resolve department: prefer the task's explicit department, then the
    // assigned role's department, then the assignee member's role department.
    const taskDept = first(t.departments as DepartmentJoin | DepartmentJoin[] | null);
    const member = first(t.practice_members as MemberJoin | MemberJoin[] | null);
    const memberRole = member ? first(member.practice_role_types as RoleJoin | RoleJoin[] | null) : null;
    const memberRoleDept = memberRole ? first(memberRole.departments as DepartmentJoin | DepartmentJoin[] | null) : null;
    const assignedRole = first(t.assigned_role as AssignedRoleJoin | AssignedRoleJoin[] | null);
    const assignedRoleDept = assignedRole ? first(assignedRole.departments) : null;
    const dept = taskDept ?? assignedRoleDept ?? memberRoleDept;

    if (dept?.name) {
      if (!deptCounts[dept.name]) deptCounts[dept.name] = { completed: 0, total: 0, color: dept.color };
      deptCounts[dept.name].total++;
      if (isCompleted) deptCounts[dept.name].completed++;
    }
  }

  // ── 3. Recent open requests (6 most recently active) ───────────────────────
  type SubmitterJoin = {
    id: string;
    profiles: ProfileJoin | ProfileJoin[] | null;
    practice_role_types: RoleJoin | RoleJoin[] | null;
  };

  const { data: rawRequests, error: reqErr } = await admin
    .from('requests')
    .select(`
      id, title, category, urgency, status, updated_at,
      submitted_member:practice_members!requests_submitted_by_fkey(
        id,
        profiles(first_name, last_name),
        practice_role_types(name, departments(name, color))
      )
    `)
    .eq('practice_id', practiceId)
    .in('status', ['submitted', 'in_review', 'in_progress', 'waiting_on_vendor'])
    .order('updated_at', { ascending: false })
    .limit(6);

  if (reqErr) return apiError(reqErr);

  const recentRequests = (rawRequests ?? []).map((r) => {
    const submitter = first(r.submitted_member as SubmitterJoin | SubmitterJoin[] | null);
    const profile = submitter ? first(submitter.profiles) : null;
    const role = submitter ? first(submitter.practice_role_types) : null;
    const dept = role ? first(role.departments) : null;

    return {
      id: r.id,
      title: r.title,
      category: r.category,
      urgency: r.urgency,
      status: r.status,
      updatedAt: r.updated_at,
      submitter: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
      dept: dept?.name ?? '',
      deptColor: dept?.color ?? '',
    };
  });

  return NextResponse.json({
    overdueTasks,
    todayProgress: { completed: todayCompleted, total: todayTotal },
    departmentCompletion: deptCounts,
    recentRequests,
  });
}
