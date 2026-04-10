import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * GET /api/departments
 * Returns all departments for the current user's practice.
 * Accessible by all authenticated users (staff need them for filters).
 */
export async function GET() {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const { data, error } = await supabase
    .from('departments')
    .select('id, name, color, is_active, sort_order')
    .eq('practice_id', practiceId)
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Count members per department via their assigned role's department_id,
  // plus secondary department assignments for roles that span departments.
  const { data: memberRoles } = await supabase
    .from('practice_members')
    .select('practice_role_types!inner(name, department_id)')
    .eq('practice_id', practiceId);

  // Roles that span secondary departments beyond their primary FK
  const SECONDARY_DEPTS: Record<string, string[]> = {
    'Office Manager':        ['IT (Information Technology)', 'Marketing', 'Finance', 'Facilities'],
    'Clinical Manager':      ['(M) Management'],
    'Insurance Coordinator': ['Finance'],
    'Third Party':           ['Finance', 'Marketing', 'Facilities'],
  };

  // Build dept name → id lookup
  const deptNameToId = new Map((data ?? []).map((d) => [d.name, d.id]));

  const deptCountMap: Record<string, number> = {};
  for (const m of memberRoles ?? []) {
    const roleRaw = m.practice_role_types as { name: string; department_id: string } | { name: string; department_id: string }[] | null;
    const role = Array.isArray(roleRaw) ? (roleRaw[0] ?? null) : roleRaw;
    if (!role) continue;

    // Count for primary department
    if (role.department_id) {
      deptCountMap[role.department_id] = (deptCountMap[role.department_id] ?? 0) + 1;
    }

    // Count for secondary departments
    const extras = SECONDARY_DEPTS[role.name];
    if (extras) {
      for (const deptName of extras) {
        const deptId = deptNameToId.get(deptName);
        if (deptId) deptCountMap[deptId] = (deptCountMap[deptId] ?? 0) + 1;
      }
    }
  }

  const result = (data ?? []).map((d) => ({ ...d, member_count: deptCountMap[d.id] ?? 0 }));
  return NextResponse.json(result);
}

/**
 * POST /api/departments
 * Creates a new department for the current user's practice.
 * Requires admin or brik_admin.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const body = await request.json();
  const { name, color, is_active } = body as { name?: string; color?: string; is_active?: boolean };

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const { count } = await supabase
    .from('departments')
    .select('*', { count: 'exact', head: true })
    .eq('practice_id', practiceId);

  const { data, error } = await supabase
    .from('departments')
    .insert({
      practice_id: practiceId,
      name: name.trim(),
      color: color || null,
      is_active: is_active ?? true,
      sort_order: (count ?? 0) + 1,
    })
    .select('id, name, color, is_active, sort_order')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A department with that name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...data, member_count: 0 }, { status: 201 });
}
