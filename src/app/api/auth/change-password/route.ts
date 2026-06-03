import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimitOrNull } from '@/lib/rate-limit';

const CHANGE_PASSWORD_LIMIT = { limit: 5, windowSeconds: 60 };
const MIN_PASSWORD_LENGTH = 8;

/**
 * POST /api/auth/change-password
 *
 * Authenticated change-password surface (#227). Verifies the user's current
 * password before applying a new one, since Supabase's vanilla
 * `auth.updateUser({ password })` does not require re-auth — without this
 * server-side check, anyone with an active session (e.g. a stolen device
 * with the browser unlocked) could rotate the password silently.
 *
 * Verification uses a fresh anon-key client + signInWithPassword against
 * the caller's email. That client has its own session storage, so it never
 * touches the caller's cookie session — the password update lands via the
 * admin client by user id.
 *
 * Errors are mapped to user-friendly strings (per #207); raw Supabase
 * messages stay in the server log.
 */
export async function POST(request: Request) {
  const limited = await rateLimitOrNull(request, 'change-password', CHANGE_PASSWORD_LIMIT);
  if (limited) return limited;

  // ── 1. Authenticated session required
  const supabase = await createServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user || !user.email) {
    return NextResponse.json(
      { error: 'You must be signed in to change your password.' },
      { status: 401 },
    );
  }

  // ── 2. Parse + validate body
  let body: { current_password?: unknown; new_password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const currentPassword = typeof body.current_password === 'string' ? body.current_password : '';
  const newPassword = typeof body.new_password === 'string' ? body.new_password : '';

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: 'Current and new password are both required.' },
      { status: 400 },
    );
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    );
  }

  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: 'New password must differ from your current password.' },
      { status: 400 },
    );
  }

  // ── 3. Reject if user has no email-password identity (SSO-only users)
  const hasEmailIdentity = (user.identities ?? []).some((i) => i.provider === 'email');
  if (!hasEmailIdentity) {
    return NextResponse.json(
      { error: 'Your account uses single sign-on. Manage your password in your identity provider.' },
      { status: 400 },
    );
  }

  // ── 4. Verify current password via isolated anon client (won't touch our cookie session)
  const verifyClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error: verifyErr } = await verifyClient.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyErr) {
    console.warn('[change-password] verify failed for', user.id, verifyErr.message);
    return NextResponse.json(
      { error: 'Current password is incorrect.' },
      { status: 400 },
    );
  }

  // ── 5. Apply new password via admin client (no session disruption)
  const admin = createAdminClient();
  const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });
  if (updateErr) {
    console.error('[change-password] updateUserById failed for', user.id, updateErr.message);
    return NextResponse.json(
      { error: 'Could not update your password. Please try again or contact support.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: 'Password updated.' }, { status: 200 });
}
