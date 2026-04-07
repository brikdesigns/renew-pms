import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

async function getPracticeId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('practice_members')
    .select('practice_id')
    .eq('user_id', userId)
    .limit(1)
    .single();
  return data?.practice_id ?? null;
}

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

  const practiceId = await getPracticeId(supabase, authUser.profile.id);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const { data, error } = await supabase
    .from('departments')
    .select('id, name, color, is_active, sort_order')
    .eq('practice_id', practiceId)
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Count members per department via their assigned role's department_id
  const { data: memberRoles } = await supabase
    .from('practice_members')
    .select('practice_role_types!inner(department_id)')
    .eq('practice_id', practiceId);

  const deptCountMap: Record<string, number> = {};
  for (const m of memberRoles ?? []) {
    const deptRaw = m.practice_role_types as { department_id: string } | { department_id: string }[] | null;
    const dept = Array.isArray(deptRaw) ? (deptRaw[0] ?? null) : deptRaw;
    if (dept?.department_id) {
      deptCountMap[dept.department_id] = (deptCountMap[dept.department_id] ?? 0) + 1;
    }
  }

  const result = (data ?? []).map((d) => ({ ...d, member_count: deptCountMap[d.id] ?? 0 }));
  return NextResponse.json(result);
}

/**
 * POST /api/departments
 * Creates a new department for the current user's practice.
 * Requires practice_admin or platform_admin.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser.profile.id);
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
