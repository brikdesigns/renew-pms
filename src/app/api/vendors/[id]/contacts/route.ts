import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * GET /api/vendors/[id]/contacts
 * Returns contacts for a specific vendor.
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

  const { data, error } = await supabase
    .from('vendor_contacts')
    .select('id, name, role, phone, email, is_primary')
    .eq('vendor_id', id)
    .eq('practice_id', practiceId)
    .order('is_primary', { ascending: false })
    .order('name');

  if (error) return apiError(error);

  return NextResponse.json(data ?? []);
}

/**
 * POST /api/vendors/[id]/contacts
 * Add a contact to a vendor. Requires admin or brik_admin.
 */
export async function POST(
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

  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('vendor_contacts')
    .insert({
      vendor_id: id,
      practice_id: practiceId,
      name: body.name.trim(),
      role: body.role?.trim() || null,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      is_primary: body.is_primary ?? false,
    })
    .select('id, name, role, phone, email, is_primary')
    .single();

  if (error) return apiError(error);

  return NextResponse.json(data, { status: 201 });
}
