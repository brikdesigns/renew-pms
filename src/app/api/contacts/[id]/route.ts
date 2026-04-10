import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * PATCH /api/contacts/[id]
 * Update a vendor contact. Requires admin or brik_admin.
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
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.role !== undefined) updates.role = body.role?.trim() || null;
  if (body.phone !== undefined) updates.phone = body.phone?.trim() || null;
  if (body.email !== undefined) updates.email = body.email?.trim() || null;
  if (body.is_primary !== undefined) updates.is_primary = body.is_primary;

  const { data, error } = await supabase
    .from('vendor_contacts')
    .update(updates)
    .eq('id', id)
    .eq('practice_id', practiceId)
    .select('id, name, role, phone, email, is_primary, vendor_id, vendors(name, type)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const vendor = Array.isArray(data.vendors) ? data.vendors[0] : data.vendors;
  return NextResponse.json({
    id: data.id,
    name: data.name,
    role: data.role,
    phone: data.phone,
    email: data.email,
    is_primary: data.is_primary,
    vendor_id: data.vendor_id,
    vendor_name: vendor?.name ?? null,
    vendor_type: vendor?.type ?? null,
  });
}

/**
 * DELETE /api/contacts/[id]
 * Delete a vendor contact. Requires admin or brik_admin.
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

  const { error } = await supabase
    .from('vendor_contacts')
    .delete()
    .eq('id', id)
    .eq('practice_id', practiceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
