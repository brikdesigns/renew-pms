import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';
import { getActiveTokenForRequest } from '@/lib/vendor-tokens';
import { sendEmail, vendorMessageEmail } from '@/lib/email';

// ─── GET — List messages for a request (authenticated) ─────────────────────

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

  // Fetch messages for this request
  const { data: messages, error } = await admin
    .from('vendor_messages')
    .select('id, sender_type, sender_name, body, vendor_status, created_at')
    .eq('request_id', id)
    .eq('practice_id', practiceId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get the latest token status for this request
  const activeToken = await getActiveTokenForRequest(id);

  // If no active token, check for any token to report its status
  let tokenStatus: string | null = null;
  let tokenValue: string | null = null;
  if (activeToken) {
    tokenStatus = 'active';
    tokenValue = activeToken.token;
  } else {
    const { data: latestToken } = await admin
      .from('vendor_request_tokens')
      .select('status')
      .eq('request_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    tokenStatus = latestToken?.status ?? null;
  }

  return NextResponse.json({
    messages: messages ?? [],
    token_status: tokenStatus,
    token: tokenValue,
  });
}

// ─── POST — Staff sends message to vendor (authenticated) ──────────────────

export async function POST(
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

  // Parse body
  let body: { body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.body || typeof body.body !== 'string' || body.body.trim().length === 0) {
    return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
  }

  if (body.body.length > 2000) {
    return NextResponse.json({ error: 'Message must be 2000 characters or less' }, { status: 400 });
  }

  // Require an active vendor token for this request
  const activeToken = await getActiveTokenForRequest(id);
  if (!activeToken) {
    return NextResponse.json({ error: 'No active vendor link for this request' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Get staff member name
  const senderName = `${authUser.profile.first_name ?? ''} ${authUser.profile.last_name ?? ''}`.trim() || 'Staff';

  // Insert message
  const { data: message, error } = await admin
    .from('vendor_messages')
    .insert({
      practice_id: practiceId,
      request_id: id,
      token_id: activeToken.id,
      sender_type: 'staff',
      sender_member_id: authUser.membership?.memberId ?? null,
      sender_name: senderName,
      body: body.body.trim(),
    })
    .select('id, sender_type, sender_name, body, vendor_status, created_at')
    .single();

  if (error) {
    console.error('[messages] Failed to insert staff message:', error);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }

  // Fire-and-forget: email vendor contact
  (async () => {
    let vendorEmail: string | null = null;
    let contactName = 'Vendor';

    if (activeToken.vendor_contact_id) {
      const { data: contact } = await admin
        .from('vendor_contacts')
        .select('name, email')
        .eq('id', activeToken.vendor_contact_id)
        .single();
      if (contact) {
        contactName = contact.name;
        vendorEmail = contact.email;
      }
    }

    if (!vendorEmail) {
      const { data: vendor } = await admin
        .from('vendors')
        .select('name, email')
        .eq('id', activeToken.vendor_id)
        .single();
      if (vendor) {
        if (contactName === 'Vendor') contactName = vendor.name;
        vendorEmail = vendor.email;
      }
    }

    if (!vendorEmail) {
      console.warn('[messages] No vendor email found — skipping notification');
      return;
    }

    // Get request title for email
    const { data: req } = await admin
      .from('requests')
      .select('title')
      .eq('id', id)
      .single();

    const email = vendorMessageEmail({
      vendorContactName: contactName,
      staffName: senderName,
      requestTitle: req?.title ?? 'Work Order',
      messagePreview: (body.body ?? '').trim(),
      token: activeToken.token,
    });

    return sendEmail({
      to: [vendorEmail],
      subject: email.subject,
      html: email.html,
      practiceId,
      template: 'vendor_message',
    });
  })().catch(err => console.error('[messages] Vendor email notification failed:', err));

  return NextResponse.json(message, { status: 201 });
}
