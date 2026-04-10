import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * GET /api/vendors/[id]
 * Returns a single vendor by ID with contact count.
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
    .from('vendors')
    .select('id, name, type, phone, email, website_url, address, notes, is_active, created_at, vendor_contacts(id)')
    .eq('id', id)
    .eq('practice_id', practiceId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    ...data,
    contact_count: Array.isArray(data.vendor_contacts) ? data.vendor_contacts.length : 0,
    vendor_contacts: undefined,
  });
}

const ALLOWED_FIELDS = [
  'name', 'type', 'phone', 'email', 'website_url', 'address', 'notes', 'is_active',
] as const;

/**
 * PATCH /api/vendors/[id]
 * Update a vendor. Requires admin or brik_admin.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
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

  // Use admin client — app-level auth (requirePracticeAdmin) already validates.
  // The user-session client's RLS policy evaluation can fail to return the updated
  // row even though the update succeeds.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('vendors')
    .update(updates)
    .eq('id', id)
    .eq('practice_id', practiceId)
    .select('id, name, type, phone, email, website_url, address, notes, is_active, created_at')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

  return NextResponse.json(data);
}

/**
 * DELETE /api/vendors/[id]
 * Delete a vendor. Requires admin or brik_admin.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('vendors')
    .delete()
    .eq('id', id)
    .eq('practice_id', practiceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
