import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * GET /api/roles/[id]
 * Returns a single practice role type by ID with department details and member count.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('practice_role_types')
    .select('id, name, description, default_system_role, is_default, is_active, sort_order, department_id, departments(id, name, color)')
    .eq('id', id)
    .eq('practice_id', practiceId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { count: memberCount } = await admin
    .from('practice_members')
    .select('*', { count: 'exact', head: true })
    .eq('practice_id', practiceId)
    .eq('practice_role_id', id);

  const deptRaw = data.departments as { id: string; name: string; color: string } | { id: string; name: string; color: string }[] | null;
  const dept = Array.isArray(deptRaw) ? (deptRaw[0] ?? null) : deptRaw;

  return NextResponse.json({
    id: data.id,
    name: data.name,
    description: data.description ?? '',
    default_system_role: data.default_system_role ?? 'staff',
    is_default: data.is_default,
    is_active: data.is_active,
    sort_order: data.sort_order,
    department_id: data.department_id,
    department: dept?.name ?? '',
    department_color: dept?.color ?? '',
    member_count: memberCount ?? 0,
  });
}

/**
 * PATCH /api/roles/[id]
 * Updates a role's name, department_id, description, is_active, or sort_order.
 * Requires admin or brik_admin.
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
  const allowed = ['name', 'department_id', 'description', 'default_system_role', 'is_active', 'sort_order'] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('practice_role_types')
    .update(updates)
    .eq('id', id)
    .eq('practice_id', practiceId)
    .select('id, name, description, default_system_role, is_default, is_active, sort_order, department_id, departments(id, name, color)')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A role with that name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deptRaw = data.departments as { id: string; name: string; color: string } | { id: string; name: string; color: string }[] | null;
  const dept = Array.isArray(deptRaw) ? (deptRaw[0] ?? null) : deptRaw;
  return NextResponse.json({
    id: data.id,
    name: data.name,
    description: data.description ?? '',
    default_system_role: data.default_system_role ?? 'staff',
    is_default: data.is_default,
    is_active: data.is_active,
    sort_order: data.sort_order,
    department_id: data.department_id,
    department: dept?.name ?? '',
    department_color: dept?.color ?? '',
    member_count: 0,
  });
}

/**
 * DELETE /api/roles/[id]
 * Deletes a role. Requires admin or brik_admin.
 * Note: is_default roles should be deactivated rather than deleted.
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

  const admin = createAdminClient();
  const { error } = await admin
    .from('practice_role_types')
    .delete()
    .eq('id', id)
    .eq('practice_id', practiceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
