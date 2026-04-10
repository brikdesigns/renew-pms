import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * GET /api/roles
 * Returns all practice role types for the current user's practice,
 * joined with their department name and color.
 * Accessible by all authenticated users.
 */
export async function GET() {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const { data, error } = await supabase
    .from('practice_role_types')
    .select('id, name, description, is_default, is_active, sort_order, department_id, departments(id, name, color)')
    .eq('practice_id', practiceId)
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Count members per role
  const { data: memberData } = await supabase
    .from('practice_members')
    .select('practice_role_id')
    .eq('practice_id', practiceId);

  const roleCountMap: Record<string, number> = {};
  for (const m of memberData ?? []) {
    if (m.practice_role_id) {
      roleCountMap[m.practice_role_id] = (roleCountMap[m.practice_role_id] ?? 0) + 1;
    }
  }

  const result = (data ?? []).map((r) => {
    const deptRaw = r.departments as { id: string; name: string; color: string } | { id: string; name: string; color: string }[] | null;
    const dept = Array.isArray(deptRaw) ? (deptRaw[0] ?? null) : deptRaw;
    return {
      id: r.id,
      name: r.name,
      description: r.description ?? '',
      is_default: r.is_default,
      is_active: r.is_active,
      sort_order: r.sort_order,
      department_id: r.department_id,
      department: dept?.name ?? '',
      department_color: dept?.color ?? '',
      member_count: roleCountMap[r.id] ?? 0,
    };
  });

  return NextResponse.json(result);
}

/**
 * POST /api/roles
 * Creates a new practice role type. Requires admin or brik_admin.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const body = await request.json() as {
    name?: string;
    department_id?: string;
    description?: string;
    is_active?: boolean;
  };

  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const { count } = await supabase
    .from('practice_role_types')
    .select('*', { count: 'exact', head: true })
    .eq('practice_id', practiceId);

  const { data, error } = await supabase
    .from('practice_role_types')
    .insert({
      practice_id: practiceId,
      name: body.name.trim(),
      department_id: body.department_id ?? null,
      description: body.description ?? null,
      is_active: body.is_active ?? true,
      sort_order: (count ?? 0) + 1,
    })
    .select('id, name, description, is_default, is_active, sort_order, department_id, departments(id, name, color)')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A role with that name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deptRaw2 = data.departments as { id: string; name: string; color: string } | { id: string; name: string; color: string }[] | null;
  const dept2 = Array.isArray(deptRaw2) ? (deptRaw2[0] ?? null) : deptRaw2;
  return NextResponse.json({
    id: data.id,
    name: data.name,
    description: data.description ?? '',
    is_default: data.is_default,
    is_active: data.is_active,
    sort_order: data.sort_order,
    department_id: data.department_id,
    department: dept2?.name ?? '',
    department_color: dept2?.color ?? '',
    member_count: 0,
  }, { status: 201 });
}
