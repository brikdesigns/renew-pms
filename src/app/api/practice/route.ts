import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

/**
 * GET /api/practice — fetch the current user's practice data.
 * Uses practice_members to resolve which practice the user belongs to.
 */
export async function GET() {
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  // Get the user's practice via practice_members
  const { data: membership, error: memError } = await supabase
    .from('practice_members')
    .select('practice_id')
    .eq('user_id', authUser.profile.id)
    .limit(1)
    .single();

  if (!membership || memError) {
    return NextResponse.json({ error: 'No practice found for user' }, { status: 404 });
  }

  const { data: practice, error: practiceError } = await supabase
    .from('practices')
    .select('id, name, slug, website_url, npi_number, tax_id, status, address_line1, address_line2, city, state, zip, phone, email, logo_url')
    .eq('id', membership.practice_id)
    .single();

  if (!practice || practiceError) {
    return NextResponse.json({ error: 'Practice not found' }, { status: 404 });
  }

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

  // Get the user's practice
  const { data: membership } = await supabase
    .from('practice_members')
    .select('practice_id')
    .eq('user_id', authUser.profile.id)
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'No practice found for user' }, { status: 404 });
  }

  const body = await request.json();

  // Allowlist of updatable fields
  const allowed = [
    'name', 'website_url', 'npi_number', 'tax_id', 'status',
    'address_line1', 'address_line2', 'city', 'state', 'zip',
    'phone', 'email',
  ];
  const updates: Record<string, string> = {};
  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: practice, error } = await supabase
    .from('practices')
    .update(updates)
    .eq('id', membership.practice_id)
    .select('id, name, slug, website_url, npi_number, tax_id, status, address_line1, address_line2, city, state, zip, phone, email, logo_url')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(practice);
}
