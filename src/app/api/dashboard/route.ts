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

  // ── 1. Overdue tasks ──────────────────────────────────────────────────────
  const { data: rawOverdue, error: overdueErr } = await admin
    .from('tasks')
    .select(`
      id, title, priority, assigned_to, assigned_department,
      departments(name, color),
      practice_members(
        id,
        profiles(first_name, last_name),
        practice_role_types(name, departments(name, color))
      )
    `)
    .eq('practice_id', practiceId)
    .eq('status', 'overdue')
    .order('priority', { ascending: true })
    .limit(20);

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

  // ── 3. Compliance items (tasks with compliance_type_id set) ───────────────
  const { data: complianceTasks, error: compErr } = await admin
    .from('tasks')
    .select(`
      id, title, status, due_date,
      compliance_types(name),
      departments(name),
      practice_members(profiles(first_name, last_name))
    `)
    .eq('practice_id', practiceId)
    .not('compliance_type_id', 'is', null)
    .in('status', ['not_started', 'in_progress', 'overdue'])
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(10);

  if (compErr) return NextResponse.json({ error: compErr.message }, { status: 500 });

  type ComplianceTypeJoin = { name: string };

  const complianceItems = (complianceTasks ?? []).map((t) => {
    const compType = first(t.compliance_types as ComplianceTypeJoin | ComplianceTypeJoin[] | null);
    const dept = first(t.departments as DepartmentJoin | DepartmentJoin[] | null);
    const member = first(t.practice_members as MemberJoin | MemberJoin[] | null);
    const profile = member ? first(member.profiles as ProfileJoin | ProfileJoin[] | null) : null;

    // Determine status label
    let statusLabel: 'upcoming' | 'due_soon' | 'overdue' | 'completed' = 'upcoming';
    if (t.status === 'overdue') statusLabel = 'overdue';
    else if (t.due_date) {
      const daysUntil = Math.ceil((new Date(t.due_date).getTime() - Date.now()) / 86400000);
      if (daysUntil <= 7) statusLabel = 'due_soon';
    }

    return {
      id: t.id,
      name: compType?.name ?? t.title,
      assignedTo: profile ? `${profile.first_name} ${profile.last_name}` : dept?.name ?? 'All Staff',
      due: t.due_date ?? null,
      status: statusLabel,
    };
  });

  return NextResponse.json({
    overdueTasks,
    todayProgress: { completed: todayCompleted, total: todayTotal },
    departmentCompletion: deptCounts,
    complianceItems,
  });
}
