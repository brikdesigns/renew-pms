import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * GET /api/contacts
 * Returns all vendor contacts for the current practice with vendor name joined.
 */
export async function GET() {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const { data, error } = await supabase
    .from('vendor_contacts')
    .select('id, name, role, phone, email, is_primary, vendor_id, vendors(name, type)')
    .eq('practice_id', practiceId)
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const contacts = (data ?? []).map(c => {
    const vendor = Array.isArray(c.vendors) ? c.vendors[0] : c.vendors;
    return {
      id: c.id,
      name: c.name,
      role: c.role,
      phone: c.phone,
      email: c.email,
      is_primary: c.is_primary,
      vendor_id: c.vendor_id,
      vendor_name: vendor?.name ?? null,
      vendor_type: vendor?.type ?? null,
    };
  });

  return NextResponse.json(contacts);
}
