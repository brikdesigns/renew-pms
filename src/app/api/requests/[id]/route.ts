import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';
import { createNotification } from '@/lib/notifications';
import { sendEmail, getMemberEmail, requestStatusChangeEmail, requestAssignedEmail, requestRejectedEmail, vendorAssignedEmail } from '@/lib/email';
import { generateVendorToken, revokeTokensForRequest, closeTokensForRequest } from '@/lib/vendor-tokens';

// ─── Shared SELECT + flatten (mirrors list endpoint) ────────────────────────

type ProfileJoin = { first_name: string; last_name: string };
type DepartmentJoin = { name: string; color: string };
type RoleJoin = { name: string; departments: DepartmentJoin | DepartmentJoin[] | null };
type MemberJoin = { id: string; profiles: ProfileJoin | ProfileJoin[] | null; practice_role_types: RoleJoin | RoleJoin[] | null };
type AssigneeMemberJoin = { id: string; profiles: ProfileJoin | ProfileJoin[] | null };

function first<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

const SINGLE_SELECT = `
  id, title, description, category, urgency, status,
  location_description, room_id, equipment_id,
  vendor_id, vendor_contact_id,
  resolution_notes, resolved_at,
  created_at, updated_at,
  rooms(name),
  equipment(name),
  vendors(name, type),
  vendor_contacts(name, phone, email),
  submitted_member:practice_members!requests_submitted_by_fkey(
    id, profiles(first_name, last_name),
    practice_role_types(name, departments(name, color))
  ),
  assigned_member:practice_members!requests_assigned_to_fkey(
    id, profiles(first_name, last_name)
  )
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenRequest(r: any) {
  const submitter = first(r.submitted_member);
  const submitterProfile = submitter ? first((submitter as MemberJoin).profiles) : null;
  const submitterRole = submitter ? first((submitter as MemberJoin).practice_role_types) : null;
  const submitterDept = submitterRole ? first(submitterRole.departments) : null;
  const assignee = first(r.assigned_member);
  const assigneeProfile = assignee ? first((assignee as AssigneeMemberJoin).profiles) : null;
  const room = first(r.rooms);
  const equip = first(r.equipment);
  const vendor = first(r.vendors);
  const contact = first(r.vendor_contacts);

  return {
    id: r.id, title: r.title, description: r.description,
    category: r.category, urgency: r.urgency, status: r.status,
    location_description: r.location_description,
    room_id: r.room_id, room_name: room?.name ?? null,
    equipment_id: r.equipment_id, equipment_name: equip?.name ?? null,
    vendor_id: r.vendor_id, vendor_name: vendor?.name ?? null, vendor_type: vendor?.type ?? null,
    vendor_contact_id: r.vendor_contact_id,
    vendor_contact_name: contact?.name ?? null,
    vendor_contact_phone: contact?.phone ?? null,
    vendor_contact_email: contact?.email ?? null,
    resolution_notes: r.resolution_notes, resolved_at: r.resolved_at,
    created_at: r.created_at, updated_at: r.updated_at,
    submitter_id: submitter?.id ?? null,
    submitter_name: submitterProfile ? `${(submitterProfile as ProfileJoin).first_name} ${(submitterProfile as ProfileJoin).last_name}`.trim() : null,
    submitter_role: submitterRole?.name ?? null,
    assignee_id: assignee?.id ?? null,
    assignee_name: assigneeProfile ? `${(assigneeProfile as ProfileJoin).first_name} ${(assigneeProfile as ProfileJoin).last_name}`.trim() : null,
  };
}

/**
 * GET /api/requests/[id]
 * Fetch a single request with all joins (same shape as the list endpoint).
 */
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
  const { data, error } = await admin
    .from('requests')
    .select(SINGLE_SELECT)
    .eq('id', id)
    .eq('practice_id', practiceId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  return NextResponse.json(flattenRequest(data));
}

const ALLOWED_FIELDS = [
  'title', 'description', 'category', 'urgency', 'status',
  'location_description', 'room_id', 'equipment_id',
  'vendor_id', 'vendor_contact_id', 'assigned_to',
  'resolution_notes',
] as const;

/**
 * PATCH /api/requests/[id]
 * Update a request's fields (status, assignment, vendor, resolution).
 */
export async function PATCH(
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

  const body = await request.json();

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch current request state for notification comparisons
  const { data: current } = await admin
    .from('requests')
    .select('title, status, submitted_by, assigned_to, practice_members!requests_submitted_by_fkey(user_id)')
    .eq('id', id)
    .eq('practice_id', practiceId)
    .maybeSingle();

  // Auto-set resolved_at on status change
  if (updates.status === 'resolved') {
    updates.resolved_at = new Date().toISOString();
  } else if (updates.status && updates.status !== 'resolved' && updates.status !== 'closed') {
    updates.resolved_at = null;
  }

  const { data, error } = await admin
    .from('requests')
    .update(updates)
    .eq('id', id)
    .eq('practice_id', practiceId)
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  // ── Notifications (fire and forget) ────────────────────────────────────────
  const statusLabels: Record<string, string> = {
    submitted: 'Submitted', in_review: 'In Review', in_progress: 'In Progress',
    waiting_on_vendor: 'Waiting on Vendor', resolved: 'Resolved', closed: 'Closed',
  };

  // Notify submitter on status change (in-app + email)
  if (updates.status && current && updates.status !== current.status) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const submitterMember = Array.isArray(current.practice_members) ? current.practice_members[0] : current.practice_members as any;
    const submitterUserId = submitterMember?.user_id;
    if (submitterUserId && submitterUserId !== authUser.profile.id) {
      createNotification({
        practiceId,
        userId: submitterUserId,
        type: 'request_status_change',
        title: `Request Updated: ${current.title}`,
        body: `Status changed to ${statusLabels[updates.status as string] ?? updates.status}`,
        link: `/requests?open=${id}`,
      }).catch(err => console.error('[notification]', err));

      // Email submitter
      if (current.submitted_by) {
        const emailTemplate = updates.status === 'closed'
          ? requestRejectedEmail(current.title, id)
          : requestStatusChangeEmail(current.title, updates.status as string, id);
        getMemberEmail(current.submitted_by as string).then(email => {
          if (!email) return;
          return sendEmail({ to: [email], ...emailTemplate, practiceId, template: 'request_status_change' });
        }).catch(err => console.error('[email]', err));
      }
    }
  }

  // Notify assignee when assigned (in-app + email)
  if (updates.assigned_to && current && updates.assigned_to !== current.assigned_to) {
    const { data: assigneeMember } = await admin
      .from('practice_members')
      .select('user_id')
      .eq('id', updates.assigned_to as string)
      .single();

    if (assigneeMember && assigneeMember.user_id !== authUser.profile.id) {
      createNotification({
        practiceId,
        userId: assigneeMember.user_id,
        type: 'request_assigned',
        title: `Request Assigned: ${current.title}`,
        body: 'You have been assigned to this request',
        link: `/requests?open=${id}`,
      }).catch(err => console.error('[notification]', err));

      // Email assignee
      const { subject, html } = requestAssignedEmail(current.title, id);
      getMemberEmail(updates.assigned_to as string).then(email => {
        if (!email) return;
        return sendEmail({ to: [email], subject, html, practiceId, template: 'request_assigned' });
      }).catch(err => console.error('[email]', err));
    }
  }

  // Notify vendor on assignment (token generation + email)
  if (updates.vendor_id !== undefined && current) {
    // Revoke any existing vendor tokens for this request
    revokeTokensForRequest(id).catch(err => console.error('[vendor-token]', err));

    if (updates.vendor_id) {
      // Generate a new vendor portal token and email the vendor contact
      generateVendorToken({
        practiceId,
        requestId: id,
        vendorId: updates.vendor_id as string,
        vendorContactId: (updates.vendor_contact_id as string) ?? null,
      }).then(async (tokenRecord) => {
        // Look up vendor contact email, fall back to vendor email
        let vendorEmail: string | null = null;
        let contactName = 'Vendor';

        if (tokenRecord.vendor_contact_id) {
          const { data: contact } = await admin
            .from('vendor_contacts')
            .select('name, email')
            .eq('id', tokenRecord.vendor_contact_id)
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
            .eq('id', tokenRecord.vendor_id)
            .single();
          if (vendor) {
            if (!contactName || contactName === 'Vendor') contactName = vendor.name;
            vendorEmail = vendor.email;
          }
        }

        if (!vendorEmail) {
          console.warn('[vendor-token] No email found for vendor — token generated but no email sent. Practice can share the link manually.');
          return;
        }

        // Look up practice name for the email
        const { data: practice } = await admin
          .from('practices')
          .select('name')
          .eq('id', practiceId)
          .single();

        const email = vendorAssignedEmail({
          vendorContactName: contactName,
          practiceName: practice?.name ?? 'Your dental practice',
          requestTitle: current.title,
          requestDescription: null, // Keep email concise — description is on the portal page
          token: tokenRecord.token,
        });

        return sendEmail({
          to: [vendorEmail],
          subject: email.subject,
          html: email.html,
          practiceId,
          template: 'vendor_assigned',
        });
      }).catch(err => console.error('[vendor-token] Token generation/email failed:', err));
    }
  }

  // Close vendor tokens when request reaches terminal state
  if (updates.status === 'resolved' || updates.status === 'closed') {
    closeTokensForRequest(id).catch(err => console.error('[vendor-token]', err));
  }

  return NextResponse.json({ id: data.id });
}
