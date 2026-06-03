import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * GET /api/vendors
 * Returns vendors for the current user's practice with contact counts.
 */
export async function GET() {
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
    .eq('practice_id', practiceId)
    .order('name');

  if (error) return apiError(error);

  const vendors = (data ?? []).map(v => ({
    ...v,
    contact_count: Array.isArray(v.vendor_contacts) ? v.vendor_contacts.length : 0,
    vendor_contacts: undefined,
  }));

  return NextResponse.json(vendors);
}

/**
 * POST /api/vendors
 * Create a new vendor. Requires admin or brik_admin.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const body = await request.json();

  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!body.type) return NextResponse.json({ error: 'Type is required' }, { status: 400 });

  // Use admin client for INSERT — app-level auth (requirePracticeAdmin) already
  // validates the user is an admin. The RLS `with check` on the user session
  // client intermittently fails due to policy evaluation timing.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('vendors')
    .insert({
      practice_id: practiceId,
      name: body.name.trim(),
      type: body.type,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      website_url: body.website_url?.trim() || null,
      address: body.address?.trim() || null,
      notes: body.notes?.trim() || null,
    })
    .select('id, name, type, phone, email, website_url, address, notes, is_active, created_at')
    .single();

  if (error) return apiError(error);

  return NextResponse.json({ ...data, contact_count: 0 }, { status: 201 });
}
