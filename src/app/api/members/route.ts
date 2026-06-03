import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';
import { flattenMember } from '@/lib/flatten-member';
import { loadMembers } from './_helpers';

/**
 * GET /api/members
 * Returns all practice members with profile and role/department details.
 * Accessible by all authenticated users. Each member also includes
 * has_signed_in (derived from auth.users.last_sign_in_at) so the admin
 * UI can offer "Resend invite" for accounts that haven't accepted yet.
 */
export async function GET() {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const admin = createAdminClient();
  try {
    const flattened = await loadMembers(admin, practiceId);
    return NextResponse.json(flattened);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load members';
    console.error('[GET /api/members] failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
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

  // Verify user_id refers to an existing auth.users row before inserting.
  // Without this check a malicious admin could pollute practice_members
  // with rows pointing at arbitrary UUIDs. The unique constraint catches
  // duplicates within a practice but not non-existent user IDs.
  const { data: targetUser, error: lookupError } = await admin.auth.admin.getUserById(body.user_id);
  if (lookupError || !targetUser?.user) {
    if (lookupError) console.error('[POST /api/members] auth lookup failed:', lookupError.message);
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

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
      id, user_id, practice_role_id, employee_type, shift, office_days, is_active, joined_at,
      profiles(id, system_role, first_name, last_name, email, phone, avatar_url),
      practice_role_types(id, name, department_id, departments(id, name, color))
    `)
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'User is already a member of this practice' }, { status: 409 });
    }
    return apiError(error);
  }

  return NextResponse.json(flattenMember(data), { status: 201 });
}
