import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

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
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  return NextResponse.json({ id: data.id });
}
