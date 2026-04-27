import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';
import { sendEmail, inviteAcceptanceEmail } from '@/lib/email';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const INVITE_EXPIRY_DAYS = 7;

/**
 * POST /api/members/[id]/resend-invite
 *
 * Generates a fresh recovery link for an existing practice member and emails
 * it via Resend using the inviteAcceptanceEmail template. Use case: the
 * original invite expired or never reached the inbox.
 *
 * Returns 409 if the user has already signed in — admin should direct them
 * to the standard /forgot-password flow instead.
 *
 * Requires admin or brik_admin.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: memberId } = await params;

  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const admin = createAdminClient();

  // Step 1: Look up the member with profile + practice scope
  const { data: member } = await admin
    .from('practice_members')
    .select('id, user_id, profiles(id, first_name, email)')
    .eq('id', memberId)
    .eq('practice_id', practiceId)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: 'Member not found in this practice' }, { status: 404 });
  }

  const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
  if (!profile?.email) {
    return NextResponse.json({ error: 'Member has no email on file' }, { status: 400 });
  }

  // Step 2: Confirm the user hasn't already accepted the invite. If they
  // have, this endpoint isn't the right tool — redirect them at /forgot-password.
  const { data: authUserRow, error: authErr } = await admin.auth.admin.getUserById(member.user_id);
  if (authErr || !authUserRow?.user) {
    console.error('[resend-invite] getUserById failed:', authErr?.message);
    return NextResponse.json({ error: 'Failed to look up user' }, { status: 500 });
  }
  if (authUserRow.user.last_sign_in_at) {
    return NextResponse.json(
      { error: 'This user has already signed in. They can use the "Forgot password" link instead.' },
      { status: 409 },
    );
  }

  // Step 3: Generate a fresh recovery link
  const redirectTo = `${SITE_URL}/api/auth/callback?redirect=${encodeURIComponent('/reset-password?flow=invite')}`;
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: profile.email,
    options: { redirectTo },
  });

  if (linkError || !linkData.properties?.action_link) {
    console.error('[resend-invite] generateLink failed:', linkError?.message);
    return NextResponse.json(
      { error: linkError?.message ?? 'Failed to generate invite link' },
      { status: 500 },
    );
  }

  // Step 4: Send the email — same template as initial invite
  const { data: practiceRow } = await admin
    .from('practices')
    .select('name')
    .eq('id', practiceId)
    .single();
  const practiceName = practiceRow?.name ?? 'your practice';

  const inviterName =
    [authUser.profile.first_name, authUser.profile.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    authUser.profile.email ||
    'A practice admin';

  try {
    const tmpl = inviteAcceptanceEmail({
      firstName: profile.first_name?.trim() || 'there',
      practiceName,
      inviterName,
      actionLink: linkData.properties.action_link,
      expiresInDays: INVITE_EXPIRY_DAYS,
    });
    await sendEmail({
      to: [profile.email],
      subject: tmpl.subject,
      html: tmpl.html,
      practiceId,
      template: 'invite-acceptance',
    });
  } catch (emailError) {
    console.error('[resend-invite] email send failed:', emailError);
    return NextResponse.json(
      { error: 'Failed to send invite email — try again or contact support' },
      { status: 500 },
    );
  }

  return NextResponse.json({ email_status: 'sent' });
}
