import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

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
  assigned_department: string | null;
  departments: DepartmentJoin | DepartmentJoin[] | null;
  practice_members: MemberJoin | MemberJoin[] | null;
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

  // ── 1. Overdue tasks (6 most recent by due_date) ───────────────────────────
  const { data: rawOverdue, error: overdueErr } = await admin
    .from('tasks')
    .select(`
      id, title, priority, due_date, assigned_to, assigned_department,
      departments(name, color),
      practice_members(
        id,
        profiles(first_name, last_name),
        practice_role_types(name, departments(name, color))
      )
    `)
    .eq('practice_id', practiceId)
    .eq('status', 'overdue')
    .order('due_date', { ascending: false })
    .limit(6);

  if (overdueErr) return NextResponse.json({ error: overdueErr.message }, { status: 500 });

  const overdueTasks = (rawOverdue ?? []).map((t: RawOverdueTask) => {
    const member = first(t.practice_members);
    const profile = member ? first(member.profiles) : null;
    const role = member ? first(member.practice_role_types) : null;
    const roleDept = role ? first(role.departments) : null;
    const taskDept = first(t.departments);
    const dept = taskDept ?? roleDept;

    return {
      id: t.id,
      title: t.title,
      priority: t.priority,
      assignee: profile ? `${profile.first_name} ${profile.last_name}` : 'Unassigned',
      dept: dept?.name ?? '',
      deptColor: dept?.color ?? '',
    };
  });

  // ── 2. Today's progress (all tasks due today or overdue) ──────────────────
  const { data: todayTasks, error: todayErr } = await admin
    .from('tasks')
    .select('id, status, assigned_department, departments(name, color), practice_members(practice_role_types(departments(name, color)))')
    .eq('practice_id', practiceId)
    .or(`due_date.eq.${today},status.eq.overdue,and(frequency.in.(daily,per_shift),due_date.lte.${today},status.neq.completed,status.neq.skipped)`)
    .limit(500);

  if (todayErr) return NextResponse.json({ error: todayErr.message }, { status: 500 });

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

  for (const t of uniqueToday) {
    const isCompleted = t.status === 'completed' || t.status === 'skipped';
    if (isCompleted) todayCompleted++;

    // Resolve department
    const taskDept = first(t.departments as DepartmentJoin | DepartmentJoin[] | null);
    const member = first(t.practice_members as MemberJoin | MemberJoin[] | null);
    const role = member ? first(member.practice_role_types as RoleJoin | RoleJoin[] | null) : null;
    const roleDept = role ? first(role.departments as DepartmentJoin | DepartmentJoin[] | null) : null;
    const dept = taskDept ?? roleDept;

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

  if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 });

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
