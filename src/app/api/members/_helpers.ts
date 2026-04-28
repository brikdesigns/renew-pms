import type { SupabaseClient } from '@supabase/supabase-js';
import { flattenMember } from '@/lib/flatten-member';

export type MemberRow = ReturnType<typeof flattenMember> & { has_signed_in: boolean };

/**
 * Load all practice members with profile + role/department joins, plus a
 * `has_signed_in` flag derived from auth.users.last_sign_in_at.
 *
 * Same logic as GET /api/members; extracted so the tasks-page server
 * loader can run it in parallel with tasks/departments instead of paying
 * a separate API round-trip + auth prelude.
 */
export async function loadMembers(
  admin: SupabaseClient,
  practiceId: string,
): Promise<MemberRow[]> {
  const { data, error } = await admin
    .from('practice_members')
    .select(`
      id, user_id, practice_role_id, employee_type, shift, is_active, joined_at,
      profiles(id, system_role, first_name, last_name, email, phone, avatar_url),
      practice_role_types(id, name, department_id, departments(id, name, color))
    `)
    .eq('practice_id', practiceId)
    .order('joined_at');
  if (error) throw error;

  // Look up auth.users.last_sign_in_at to flag never-accepted invites.
  // listUsers paginates; perPage=1000 covers MVP-scale single-tenant use.
  const { data: authData, error: authErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (authErr) {
    console.error('[loadMembers] listUsers failed (has_signed_in defaulting to true):', authErr.message);
  }
  const signedInIds = new Set(
    (authData?.users ?? [])
      .filter((u) => u.last_sign_in_at)
      .map((u) => u.id),
  );

  return (data ?? []).map((m) => ({
    ...flattenMember(m),
    // If listUsers failed, default to true so we don't surface a misleading
    // "never accepted" badge for users who actually have signed in.
    has_signed_in: authErr ? true : signedInIds.has(m.user_id),
  }));
}
