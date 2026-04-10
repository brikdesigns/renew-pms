import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

type ProfileJoin = { id: string; system_role: string; first_name: string; last_name: string; email: string; phone: string | null; avatar_url: string | null };
type DepartmentJoin = { id: string; name: string; color: string };
type RoleJoin = { id: string; name: string; department_id: string | null; departments: DepartmentJoin | DepartmentJoin[] | null };

function flattenMember(m: {
  id: string;
  user_id: string;
  practice_role_id: string | null;
  employee_type: string;
  shift: string | null;
  is_active: boolean;
  joined_at: string;
  profiles: ProfileJoin | ProfileJoin[] | null;
  practice_role_types: RoleJoin | RoleJoin[] | null;
}) {
  const profile = Array.isArray(m.profiles) ? (m.profiles[0] ?? null) : m.profiles;
  const role = Array.isArray(m.practice_role_types) ? (m.practice_role_types[0] ?? null) : m.practice_role_types;
  const deptRaw = role?.departments ?? null;
  const dept = Array.isArray(deptRaw) ? (deptRaw[0] ?? null) : deptRaw;

  return {
    id: m.id,
    user_id: m.user_id,
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
    email: profile?.email ?? '',
    phone: profile?.phone ?? '',
    avatar_url: profile?.avatar_url ?? null,
    system_role: profile?.system_role ?? 'staff',
    practice_role_id: m.practice_role_id,
    practice_role: role?.name ?? '',
    department_id: role?.department_id ?? null,
    department: dept?.name ?? '',
    department_color: dept?.color ?? '',
    employee_type: m.employee_type,
    shift: m.shift ?? '',
    is_active: m.is_active,
    joined_at: m.joined_at,
  };
}

/**
 * GET /api/members
 * Returns all practice members with profile and role/department details.
 * Accessible by all authenticated users.
 */
export async function GET() {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('practice_members')
    .select(`
      id, user_id, practice_role_id, employee_type, shift, is_active, joined_at,
      profiles(id, system_role, first_name, last_name, email, phone, avatar_url),
      practice_role_types(id, name, department_id, departments(id, name, color))
    `)
    .eq('practice_id', practiceId)
    .order('joined_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map(flattenMember));
}

/**
 * POST /api/members
 * Adds an existing user (by email) to the practice.
 * Requires admin or brik_admin.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const body = await request.json() as {
    user_id?: string;
    practice_role_id?: string;
    employee_type?: string;
    shift?: string;
  };

  if (!body.user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('practice_members')
    .insert({
      practice_id: practiceId,
      user_id: body.user_id,
      practice_role_id: body.practice_role_id ?? null,
      employee_type: body.employee_type ?? 'new',
      shift: body.shift ?? null,
    })
    .select(`
      id, user_id, practice_role_id, employee_type, shift, is_active, joined_at,
      profiles(id, system_role, first_name, last_name, email, phone, avatar_url),
      practice_role_types(id, name, department_id, departments(id, name, color))
    `)
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'User is already a member of this practice' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(flattenMember(data), { status: 201 });
}
