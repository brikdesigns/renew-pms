import { createClient } from '@/lib/supabase/server';
import type { AuthUser } from '@/lib/auth';

/**
 * Resolve the practice ID for the current user.
 *
 * - Staff / admin: looks up via practice_members
 * - brik_admin: if no membership, falls back to the first practice
 *   (platform admins have cross-practice access)
 */
export async function getPracticeId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  authUser: AuthUser,
): Promise<string | null> {
  // Try membership first (works for all roles)
  const { data: member } = await supabase
    .from('practice_members')
    .select('practice_id')
    .eq('user_id', authUser.profile.id)
    .limit(1)
    .single();

  if (member?.practice_id) return member.practice_id;

  // Platform admin fallback — pick the first practice
  if (authUser.profile.system_role === 'brik_admin') {
    const { data: practice } = await supabase
      .from('practices')
      .select('id')
      .limit(1)
      .single();
    return practice?.id ?? null;
  }

  return null;
}
