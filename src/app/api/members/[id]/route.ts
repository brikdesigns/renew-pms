import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePracticeAdmin } from '@/lib/auth';
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
 * PATCH /api/members/[id]
 * Updates a member's practice-level fields and/or profile fields.
 * Requires practice_admin or platform_admin.
 *
 * Accepted fields:
 *   practice_members: practice_role_id, employee_type, shift, is_active
 *   profiles:         first_name, last_name, phone, system_role
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const body = await request.json();

  // Split updates across two tables
  const memberAllowed = ['practice_role_id', 'employee_type', 'shift', 'is_active'] as const;
  const profileAllowed = ['first_name', 'last_name', 'phone', 'system_role'] as const;

  const memberUpdates: Record<string, unknown> = {};
  const profileUpdates: Record<string, unknown> = {};

  for (const key of memberAllowed) {
    if (key in body) memberUpdates[key] = body[key];
  }
  for (const key of profileAllowed) {
    if (key in body) profileUpdates[key] = body[key];
  }

  if (Object.keys(memberUpdates).length === 0 && Object.keys(profileUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Verify the member belongs to this practice
  const { data: memberCheck } = await supabase
    .from('practice_members')
    .select('id, user_id')
    .eq('id', id)
    .eq('practice_id', practiceId)
    .single();

  if (!memberCheck) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  // Update practice_members if needed
  if (Object.keys(memberUpdates).length > 0) {
    const { error: memberErr } = await supabase
      .from('practice_members')
      .update(memberUpdates)
      .eq('id', id)
      .eq('practice_id', practiceId);

    if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  // Update profiles if needed
  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileErr } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', memberCheck.user_id);

    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  // Return updated member with full joins
  const { data, error } = await supabase
    .from('practice_members')
    .select(`
      id, user_id, practice_role_id, employee_type, shift, is_active, joined_at,
      profiles(id, system_role, first_name, last_name, email, phone, avatar_url),
      practice_role_types(id, name, department_id, departments(id, name, color))
    `)
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(flattenMember(data));
}

/**
 * DELETE /api/members/[id]
 * Removes a member from the practice.
 * Requires practice_admin or platform_admin.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const { error } = await supabase
    .from('practice_members')
    .delete()
    .eq('id', id)
    .eq('practice_id', practiceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
