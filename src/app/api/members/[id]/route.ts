import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requirePracticeAdmin, isAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';
import { flattenMember } from '@/lib/flatten-member';

/**
 * GET /api/members/[id]
 * Returns a single practice member by ID with profile and role/department details.
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
    .from('practice_members')
    .select(`
      id, user_id, practice_role_id, employee_type, shift, is_active, joined_at,
      profiles(id, system_role, first_name, last_name, email, phone, avatar_url),
      practice_role_types(id, name, department_id, departments(id, name, color))
    `)
    .eq('id', id)
    .eq('practice_id', practiceId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(flattenMember(data));
}

/**
 * PATCH /api/members/[id]
 * Updates a member's practice-level fields and/or profile fields.
 *
 * Authorization:
 *   - Practice admins can edit any member in their practice (all fields below).
 *   - Any authenticated user can edit their OWN basic profile fields
 *     (first_name, last_name, phone). Self-edits cannot change role or
 *     practice metadata — those stay admin-only.
 *
 * Accepted fields (admin only):
 *   practice_members: practice_role_id, employee_type, shift, is_active
 *   profiles:         system_role
 *
 * Accepted fields (self or admin):
 *   profiles:         first_name, last_name, phone
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const body = await request.json();

  const adminClient = createAdminClient();

  // Verify the member belongs to this practice and resolve ownership.
  const { data: memberCheck } = await adminClient
    .from('practice_members')
    .select('id, user_id')
    .eq('id', id)
    .eq('practice_id', practiceId)
    .single();

  if (!memberCheck) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  const isSelf = memberCheck.user_id === authUser.user.id;
  const callerIsAdmin = isAdmin(authUser.profile.system_role);

  if (!isSelf && !callerIsAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Field allowlists — staff/manager self-edits cannot escalate role or
  // change practice metadata.
  const selfProfileFields = ['first_name', 'last_name', 'phone'] as const;
  const adminMemberFields = ['practice_role_id', 'employee_type', 'shift', 'is_active'] as const;
  const adminProfileFields = ['system_role'] as const;

  const memberUpdates: Record<string, unknown> = {};
  const profileUpdates: Record<string, unknown> = {};

  for (const key of selfProfileFields) {
    if (key in body) profileUpdates[key] = body[key];
  }
  if (callerIsAdmin) {
    for (const key of adminMemberFields) {
      if (key in body) memberUpdates[key] = body[key];
    }
    for (const key of adminProfileFields) {
      if (key in body) profileUpdates[key] = body[key];
    }
  }

  if (Object.keys(memberUpdates).length === 0 && Object.keys(profileUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Update practice_members if needed
  if (Object.keys(memberUpdates).length > 0) {
    const { error: memberErr } = await adminClient
      .from('practice_members')
      .update(memberUpdates)
      .eq('id', id)
      .eq('practice_id', practiceId);

    if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  // Update profiles if needed
  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileErr } = await adminClient
      .from('profiles')
      .update(profileUpdates)
      .eq('id', memberCheck.user_id);

    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  // Return updated member with full joins
  const { data, error } = await adminClient
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
 * Requires admin or brik_admin.
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
    .from('practice_members')
    .delete()
    .eq('id', id)
    .eq('practice_id', practiceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
