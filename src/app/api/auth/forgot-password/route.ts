import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, passwordResetEmail } from '@/lib/email';
import { rateLimitOrNull } from '@/lib/rate-limit';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const RESET_EXPIRY_DAYS = 7;

const FORGOT_PASSWORD_LIMIT = { limit: 5, windowSeconds: 60 };

const GENERIC_RESPONSE = {
  message: 'If an account exists for this email, a reset link is on its way.',
};

// Minimum response time floor (ms). Hides the ~20-30x latency difference between
// the no-account path (DB lookup only) and the account-exists path (DB + generateLink
// + Resend). Without this, a timing oracle distinguishes "no account" from
// "link sent" and lets an attacker enumerate registered emails.
const MIN_RESPONSE_MS = 350;

/**
 * POST /api/auth/forgot-password
 *
 * Generates a Supabase recovery link for the given email and sends it via
 * Resend using the branded passwordResetEmail template. Always returns a
 * generic 200 response — never reveals whether an account exists, to prevent
 * email enumeration. Response time is floored to MIN_RESPONSE_MS so timing
 * analysis can't distinguish account-exists from no-account.
 *
 * Rate-limited by IP. Real work only happens if the email matches a profile.
 */
export async function POST(request: Request) {
  const start = Date.now();
  const limited = await rateLimitOrNull(request, 'forgot-password', FORGOT_PASSWORD_LIMIT);
  if (limited) return limited;

  const respond = async () => {
    const elapsed = Date.now() - start;
    if (elapsed < MIN_RESPONSE_MS) {
      await new Promise((r) => setTimeout(r, MIN_RESPONSE_MS - elapsed));
    }
    return NextResponse.json(GENERIC_RESPONSE);
  };

  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return respond();
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) return respond();

  // Look up profile — if missing, return generic success without doing work
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, first_name, email')
    .eq('email', email)
    .maybeSingle();

  if (!profile) {
    // Intentionally return success without sending — prevents enumeration
    return respond();
  }

  const redirectTo = `${SITE_URL}/api/auth/callback?redirect=${encodeURIComponent('/reset-password?flow=recovery')}`;

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  });

  if (linkError || !linkData.properties?.action_link) {
    console.error('[forgot-password] generateLink failed:', linkError?.message);
    // Still return generic success — don't leak whether account exists or
    // internal failures. Operator sees the failure in logs.
    return respond();
  }

  try {
    const tmpl = passwordResetEmail({
      firstName: profile.first_name?.trim() || 'there',
      actionLink: linkData.properties.action_link,
      expiresInDays: RESET_EXPIRY_DAYS,
    });
    await sendEmail({
      to: [email],
      subject: tmpl.subject,
      html: tmpl.html,
      practiceId: '', // no practice context for password resets
      template: 'password-reset',
    });
  } catch (emailError) {
    console.error('[forgot-password] email send failed:', emailError);
    // Generic response either way — operator sees failure in logs
  }

  return respond();
}
