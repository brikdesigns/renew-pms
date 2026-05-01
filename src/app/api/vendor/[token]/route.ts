import { NextResponse } from 'next/server';
import { rateLimitOrNull, VENDOR_TOKEN_LIMIT } from '@/lib/rate-limit';
import { validateVendorToken } from '@/lib/vendor-tokens';
import { createAdminClient } from '@/lib/supabase/admin';
import { createNotifications, getPracticeAdminUserIds } from '@/lib/notifications';
import { sendEmail, getPracticeAdminEmails, staffVendorReplyEmail } from '@/lib/email';

const VENDOR_STATUS_VALUES = ['acknowledged', 'scheduled', 'in_progress', 'on_hold', 'parts_ordered', 'completed'];

// ─── GET — View request + messages (public, rate-limited) ──────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const limited = rateLimitOrNull(request, 'vendor-view', VENDOR_TOKEN_LIMIT);
  if (limited) return limited;

  const { token } = await params;
  const result = await validateVendorToken(token);

  if (!result.valid) {
    if (result.reason === 'expired') {
      return NextResponse.json(
        { error: 'This vendor link has expired. Please contact the practice for a new link.' },
        { status: 410 }
      );
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data } = result;

  // Return scoped data — no practice internals
  return NextResponse.json({
    request: {
      id: data.request.id,
      title: data.request.title,
      description: data.request.description,
      category: data.request.category,
      urgency: data.request.urgency,
      status: data.request.status,
      location_description: data.request.location_description,
      room_name: data.room_name,
      equipment_name: data.equipment_name,
      created_at: data.request.created_at,
    },
    vendor: { name: data.vendor.name },
    vendor_contact: data.vendor_contact
      ? { name: data.vendor_contact.name }
      : null,
    messages: data.messages,
    expires_at: data.token.expires_at,
  });
}

// ─── POST — Vendor reply (public, rate-limited) ────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const limited = rateLimitOrNull(request, 'vendor-reply', VENDOR_TOKEN_LIMIT);
  if (limited) return limited;

  const { token } = await params;
  const result = await validateVendorToken(token);

  if (!result.valid) {
    if (result.reason === 'expired') {
      return NextResponse.json(
        { error: 'This vendor link has expired. You can no longer post updates.' },
        { status: 410 }
      );
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data } = result;

  // Parse and validate body
  let body: { body?: string; vendor_status?: string };
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

  if (body.vendor_status && !VENDOR_STATUS_VALUES.includes(body.vendor_status)) {
    return NextResponse.json({ error: `Invalid vendor status. Must be one of: ${VENDOR_STATUS_VALUES.join(', ')}` }, { status: 400 });
  }

  const senderName = data.vendor_contact?.name ?? data.vendor.name;

  // Insert message
  const admin = createAdminClient();
  const { data: message, error } = await admin
    .from('vendor_messages')
    .insert({
      practice_id: data.token.practice_id,
      request_id: data.request.id,
      token_id: data.token.id,
      sender_type: 'vendor',
      sender_name: senderName,
      body: body.body.trim(),
      vendor_status: body.vendor_status ?? null,
    })
    .select('id, sender_type, sender_name, body, vendor_status, created_at')
    .single();

  if (error) {
    console.error('[vendor-api] Failed to insert message:', error);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }

  // Fire-and-forget: notify practice admins
  const practiceId = data.token.practice_id;
  const requestTitle = data.request.title;
  const requestId = data.request.id;

  Promise.all([
    // In-app notifications
    getPracticeAdminUserIds(practiceId).then(userIds =>
      createNotifications({
        practiceId,
        userIds,
        type: 'vendor_message',
        title: `Vendor Reply: ${requestTitle}`,
        body: `${senderName} responded to "${requestTitle}"`,
        link: `/requests?open=${requestId}`,
      })
    ),
    // Email notifications
    getPracticeAdminEmails(practiceId).then(emails => {
      if (emails.length === 0) return;
      const email = staffVendorReplyEmail({
        vendorName: data.vendor.name,
        vendorContactName: senderName,
        requestTitle,
        requestId,
        messagePreview: (body.body ?? '').trim(),
        vendorStatus: body.vendor_status,
      });
      return sendEmail({
        to: emails,
        subject: email.subject,
        html: email.html,
        practiceId,
        template: 'vendor_reply',
      });
    }),
  ]).catch(err => console.error('[vendor-api] Notification failed:', err));

  return NextResponse.json(message, { status: 201 });
}
