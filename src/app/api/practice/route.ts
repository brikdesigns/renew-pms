import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * GET /api/practice — fetch the current user's practice data.
 */
export async function GET() {
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const admin = createAdminClient();
  const { data: practice, error } = await admin
    .from('practices')
    .select('id, name, slug, website_url, npi_number, tax_id, status, address_line1, address_line2, city, state, zip, phone, email, logo_url')
    .eq('id', practiceId)
    .single();

  if (error || !practice) return NextResponse.json({ error: 'Practice not found' }, { status: 404 });

  return NextResponse.json(practice);
}

/**
 * PATCH /api/practice — update the current user's practice data.
 * Only admin and brik_admin can update.
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const body = await request.json();

  const allowed = [
    'name', 'website_url', 'npi_number', 'tax_id', 'status',
    'address_line1', 'address_line2', 'city', 'state', 'zip',
    'phone', 'email',
  ];
  const updates: Record<string, string> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: practice, error } = await admin
    .from('practices')
    .update(updates)
    .eq('id', practiceId)
    .select('id, name, slug, website_url, npi_number, tax_id, status, address_line1, address_line2, city, state, zip, phone, email, logo_url')
    .single();

  if (error) return apiError(error);

  return NextResponse.json(practice);
}
