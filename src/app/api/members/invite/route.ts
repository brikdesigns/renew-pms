import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';
import { flattenMember } from '@/lib/flatten-member';
import { sendEmail, inviteAcceptanceEmail } from '@/lib/email';

interface InviteBody {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  system_role?: string;
  practice_role_id?: string | null;
  employee_type?: string;
  shift?: string | null;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const INVITE_EXPIRY_DAYS = 7;

/**
 * POST /api/members/invite
 *
 * Creates an auth user via generateLink (or finds existing by email and
 * generates a recovery link), upserts their profile, adds them as a practice
 * member, and emails them a branded invite via Resend. Requires admin or
 * brik_admin.
 *
 * Response includes `email_status: 'sent' | 'failed'`. On 'failed', the
 * member rows still exist — admin can resend via the Settings → Users action.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const body = (await request.json()) as InviteBody;

  if (!body.email?.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }
  if (!body.first_name?.trim()) {
    return NextResponse.json({ error: 'First name is required' }, { status: 400 });
  }

  const email = body.email.trim();
  const firstName = body.first_name.trim();
  const lastName = body.last_name?.trim() ?? '';

  const admin = createAdminClient();

  // Redirect target after the user clicks the link — Supabase verifies the OTP,
  // then redirects to /api/auth/callback which exchanges the code for a session
  // and forwards to /reset-password where they set a password.
  const redirectTo = `${SITE_URL}/api/auth/callback?redirect=${encodeURIComponent('/reset-password?flow=invite')}`;

  // Step 1: Resolve user_id + action_link.
  // Existing profile → recovery link (re-invite).
  // No profile → invite link (creates auth user).
  let userId: string;
  let actionLink: string;

  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingProfile?.id) {
    userId = existingProfile.id;

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    });

    if (error || !data.properties?.action_link) {
      console.error('[invite] generateLink (recovery) failed:', error?.message);
      return NextResponse.json(
        { error: error?.message ?? 'Failed to generate invite link' },
        { status: 500 },
      );
    }
    actionLink = data.properties.action_link;
  } else {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        data: { first_name: firstName, last_name: lastName },
        redirectTo,
      },
    });

    if (error?.message?.includes('already been registered')) {
      // Auth row exists but no profile row — orphaned account
      return NextResponse.json(
        { error: 'A user with this email exists in auth but has no profile. Contact support.' },
        { status: 409 },
      );
    }
    if (error || !data.properties?.action_link || !data.user) {
      console.error('[invite] generateLink (invite) failed:', error?.message);
      return NextResponse.json(
        { error: error?.message ?? 'Failed to generate invite link' },
        { status: 500 },
      );
    }
    userId = data.user.id;
    actionLink = data.properties.action_link;
  }

  // Recovery-type magic links for users with email_confirmed_at=null are
  // rejected as "otp_expired" before TTL — see #186. Confirm immediately so
  // re-invites and any recovery flow for these users work. Idempotent.
  const { error: confirmError } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });
  if (confirmError) {
    console.error('[invite] email_confirm failed:', confirmError.message);
  }

  // Step 2: Upsert profile with the provided details
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: body.phone?.trim() ?? null,
      system_role: body.system_role ?? 'staff',
      is_active: true,
    }, { onConflict: 'id' });

  if (profileError) {
    console.error('[invite] Failed to upsert profile:', profileError.message);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Step 3: Create practice_member (duplicate check via unique constraint)
  const { error: memberError } = await admin
    .from('practice_members')
    .insert({
      practice_id: practiceId,
      user_id: userId,
      practice_role_id: body.practice_role_id ?? null,
      employee_type: body.employee_type ?? 'new',
      shift: body.shift ?? null,
      is_active: true,
    });

  if (memberError) {
    if (memberError.code === '23505') {
      return NextResponse.json(
        { error: 'This user is already a member of the practice' },
        { status: 409 },
      );
    }
    console.error('[invite] Failed to create practice_member:', memberError.message);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // Step 4: Fetch the full member record with joins
  const { data: member, error: fetchError } = await admin
    .from('practice_members')
    .select(`
      id, user_id, practice_role_id, employee_type, shift, office_days, is_active, joined_at,
      profiles(id, system_role, first_name, last_name, email, phone, avatar_url),
      practice_role_types(id, name, department_id, departments(id, name, color))
    `)
    .eq('practice_id', practiceId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !member) {
    console.error('[invite] Failed to fetch created member:', fetchError?.message);
    return NextResponse.json({ error: 'User created but failed to fetch member record' }, { status: 500 });
  }

  // Step 5: Send invite email — failure does NOT roll back the user/member.
  // Member exists; admin can resend via the Settings → Users action.
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

  let emailStatus: 'sent' | 'failed' = 'sent';
  try {
    const tmpl = inviteAcceptanceEmail({
      firstName,
      practiceName,
      inviterName,
      actionLink,
      expiresInDays: INVITE_EXPIRY_DAYS,
    });
    await sendEmail({
      to: [email],
      subject: tmpl.subject,
      html: tmpl.html,
      practiceId,
      template: 'invite-acceptance',
    });
  } catch (emailError) {
    console.error('[invite] email send failed (member created — admin can resend):', emailError);
    emailStatus = 'failed';
  }

  return NextResponse.json(
    {
      ...flattenMember(member),
      // Freshly created via generateLink — they cannot have signed in yet
      has_signed_in: false,
      email_status: emailStatus,
    },
    { status: 201 },
  );
}
