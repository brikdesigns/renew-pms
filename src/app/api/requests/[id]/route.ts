import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';
import { createNotification } from '@/lib/notifications';

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

  // Fetch current request state for notification comparisons
  const { data: current } = await supabase
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

  const { data, error } = await supabase
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

  // Notify submitter on status change
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
    }
  }

  // Notify assignee when assigned
  if (updates.assigned_to && current && updates.assigned_to !== current.assigned_to) {
    // Look up the assignee's user_id from practice_members
    const { data: assigneeMember } = await supabase
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
    }
  }

  return NextResponse.json({ id: data.id });
}
