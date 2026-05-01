import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';
import { createNotifications, getPracticeAdminUserIds } from '@/lib/notifications';
import { sendEmail, getPracticeAdminEmails } from '@/lib/email';

// ─── Join types ─────────────────────────────────────────────────────────────

type ProfileJoin = { first_name: string; last_name: string };
type DepartmentJoin = { name: string; color: string };
type RoleJoin = { name: string; departments: DepartmentJoin | DepartmentJoin[] | null };
type MemberJoin = {
  id: string;
  profiles: ProfileJoin | ProfileJoin[] | null;
  practice_role_types: RoleJoin | RoleJoin[] | null;
};
type AssigneeMemberJoin = {
  id: string;
  profiles: ProfileJoin | ProfileJoin[] | null;
};
type RoomJoin = { name: string };
type EquipmentJoin = { name: string };
type VendorJoin = { name: string; type: string };
type VendorContactJoin = { name: string; phone: string | null; email: string | null };

function first<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

interface RawRequest {
  id: string;
  title: string;
  description: string | null;
  category: string;
  urgency: string;
  status: string;
  location_description: string | null;
  room_id: string | null;
  equipment_id: string | null;
  vendor_id: string | null;
  vendor_contact_id: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  rooms: RoomJoin | RoomJoin[] | null;
  equipment: EquipmentJoin | EquipmentJoin[] | null;
  vendors: VendorJoin | VendorJoin[] | null;
  vendor_contacts: VendorContactJoin | VendorContactJoin[] | null;
  submitted_member: MemberJoin | MemberJoin[] | null;
  assigned_member: AssigneeMemberJoin | AssigneeMemberJoin[] | null;
}

function flattenRequest(r: RawRequest) {
  const submitter = first(r.submitted_member);
  const submitterProfile = submitter ? first(submitter.profiles) : null;
  const submitterRole = submitter ? first(submitter.practice_role_types) : null;
  const submitterDept = submitterRole ? first(submitterRole.departments) : null;

  const assignee = first(r.assigned_member);
  const assigneeProfile = assignee ? first(assignee.profiles) : null;

  const room = first(r.rooms);
  const equip = first(r.equipment);
  const vendor = first(r.vendors);
  const contact = first(r.vendor_contacts);

  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    urgency: r.urgency,
    status: r.status,
    location_description: r.location_description,
    room_id: r.room_id,
    room_name: room?.name ?? null,
    equipment_id: r.equipment_id,
    equipment_name: equip?.name ?? null,
    vendor_id: r.vendor_id,
    vendor_name: vendor?.name ?? null,
    vendor_type: vendor?.type ?? null,
    vendor_contact_id: r.vendor_contact_id,
    vendor_contact_name: contact?.name ?? null,
    vendor_contact_phone: contact?.phone ?? null,
    vendor_contact_email: contact?.email ?? null,
    resolution_notes: r.resolution_notes,
    resolved_at: r.resolved_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
    submitter_id: submitter?.id ?? null,
    submitter_name: submitterProfile ? `${submitterProfile.first_name} ${submitterProfile.last_name}`.trim() : null,
    submitter_role: submitterRole?.name ?? null,
    submitter_department: submitterDept?.name ?? null,
    submitter_department_color: submitterDept?.color ?? null,
    assignee_id: assignee?.id ?? null,
    assignee_name: assigneeProfile ? `${assigneeProfile.first_name} ${assigneeProfile.last_name}`.trim() : null,
  };
}

const REQUEST_SELECT = `
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
    id,
    profiles(first_name, last_name),
    practice_role_types(name, departments(name, color))
  ),
  assigned_member:practice_members!requests_assigned_to_fkey(
    id,
    profiles(first_name, last_name)
  )
`;

/**
 * GET /api/requests?status=...&category=...&urgency=...
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const { searchParams } = new URL(request.url);

  const admin = createAdminClient();
  let query = admin
    .from('requests')
    .select(REQUEST_SELECT)
    .eq('practice_id', practiceId)
    .order('created_at', { ascending: false });

  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const urgency = searchParams.get('urgency');
  const mine = searchParams.get('mine');

  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);
  if (urgency) query = query.eq('urgency', urgency);

  const equipmentId = searchParams.get('equipment_id');
  if (equipmentId) query = query.eq('equipment_id', equipmentId);

  // Staff filter: only requests submitted by or assigned to this member
  if (mine) {
    query = query.or(`submitted_by.eq.${mine},assigned_to.eq.${mine}`);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map(flattenRequest));
}

/**
 * POST /api/requests
 * Any authenticated staff can submit a request.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const admin = createAdminClient();

  // Get the current user's practice member ID for submitted_by
  const { data: member } = await admin
    .from('practice_members')
    .select('id')
    .eq('user_id', authUser.profile.id)
    .eq('practice_id', practiceId)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!member) {
    console.error('[POST /api/requests] No practice_member found for user:', authUser.profile.id, 'practice:', practiceId);
    return NextResponse.json({ error: 'No practice membership found for current user' }, { status: 403 });
  }

  const body = await request.json();

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }
  if (!body.category) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('requests')
    .insert({
      practice_id: practiceId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      category: body.category,
      urgency: body.urgency || 'medium',
      location_description: body.location_description?.trim() || null,
      room_id: body.room_id || null,
      equipment_id: body.equipment_id || null,
      vendor_id: body.vendor_id || null,
      vendor_contact_id: body.vendor_contact_id || null,
      submitted_by: member.id,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Notifications (fire and forget) ────────────────────────────────────────
  const catLabels: Record<string, string> = { device_issue: 'Device Issue', equipment_issue: 'Equipment Issue', facility_maintenance: 'Facility / Maintenance' };
  const priLabels: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
  const who = `${authUser.profile.first_name ?? ''} ${authUser.profile.last_name ?? ''}`.trim() || (authUser.profile.email ?? 'Staff');
  const notifBody = `${who} submitted a ${priLabels[body.urgency] ?? 'medium'} priority ${catLabels[body.category] ?? ''} request`;

  // Email admins
  getPracticeAdminEmails(practiceId).then(emails => {
    if (emails.length === 0) return;
    return sendEmail({
      to: emails,
      subject: `New Request: ${body.title.trim()}`,
      html: `<h2>New Request Submitted</h2><p><strong>${body.title.trim()}</strong></p><p>${notifBody}</p>${body.description ? `<p>${body.description.trim()}</p>` : ''}<p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/requests">View in Renew PMS</a></p>`,
      practiceId,
      template: 'new_request',
    });
  }).catch(err => console.error('[email]', err));

  // In-app notify admins
  getPracticeAdminUserIds(practiceId).then(ids => {
    if (ids.length === 0) return;
    return createNotifications({ practiceId, userIds: ids, type: 'request_new', title: `New Request: ${body.title.trim()}`, body: notifBody, link: `/requests?open=${data.id}` });
  }).catch(err => console.error('[notification]', err));

  return NextResponse.json(data, { status: 201 });
}
