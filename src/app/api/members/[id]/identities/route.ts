import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, isAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * GET /api/members/[id]/identities
 *
 * Returns the linked auth identities (email/Google/etc.) for a practice
 * member. Used by ViewUserSheet's Sign-in methods section (#226 AC #5).
 *
 * Authorization:
 *   - Practice admin (admin / brik_admin) for any member in their practice
 *   - brik_admin for any member across any practice
 *   - Self: a non-admin user can fetch their own identities (so the same
 *     endpoint works from the Settings → Account surface as well as the
 *     admin Users surface, instead of two parallel endpoints)
 *
 * Identity fields are projected to the wire-friendly shape used by
 * SignInMethodsSection — `id`, `provider`, `email` (from identity_data),
 * `last_sign_in_at`. We intentionally do NOT return `identity_data` in
 * full — it's a free-form provider blob and could carry IdP-specific
 * info that doesn't belong in our UI.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: memberId } = await params;
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const callerPracticeId = await getPracticeId(supabase, authUser);
  if (!callerPracticeId) {
    return NextResponse.json({ error: 'No practice found' }, { status: 404 });
  }

  const admin = createAdminClient();

  // Look up the target practice_member to confirm scope + extract user_id.
  // brik_admin can cross practices; everyone else is pinned to their own practice.
  const callerIsBrikAdmin = authUser.profile.system_role === 'brik_admin';
  const callerIsAdmin = isAdmin(authUser.profile.system_role);

  const memberQuery = admin
    .from('practice_members')
    .select('id, user_id, practice_id')
    .eq('id', memberId);
  if (!callerIsBrikAdmin) {
    memberQuery.eq('practice_id', callerPracticeId);
  }
  const { data: member, error: memberErr } = await memberQuery.maybeSingle();

  if (memberErr) {
    console.error('[members/identities] member lookup failed:', memberErr.message);
    return NextResponse.json({ error: 'Could not load member.' }, { status: 500 });
  }
  if (!member) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Self-access path: any user can fetch their own identities. Admins
  // (practice or brik) cover the cross-user case above.
  const isSelf = member.user_id === authUser.user.id;
  if (!isSelf && !callerIsAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Pull identities via the auth admin SDK. getUserById returns the auth row
  // including `identities[]`.
  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(member.user_id);
  if (userErr || !userData?.user) {
    console.error('[members/identities] getUserById failed:', userErr?.message);
    return NextResponse.json({ error: 'Could not load sign-in methods.' }, { status: 500 });
  }

  const linkedIdentities = (userData.user.identities ?? []).map((i) => ({
    id: i.id,
    provider: i.provider,
    email: typeof i.identity_data?.email === 'string' ? i.identity_data.email : null,
    last_sign_in_at: i.last_sign_in_at ?? null,
  }));

  const primaryEmail = userData.user.email ?? '';
  const mismatchedIdentities = linkedIdentities.filter(
    (i) => i.provider !== 'email' && i.email && i.email.toLowerCase() !== primaryEmail.toLowerCase(),
  );

  return NextResponse.json({
    primary_email: primaryEmail,
    identities: linkedIdentities,
    mismatched_identities: mismatchedIdentities,
  });
}
