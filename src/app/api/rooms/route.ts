import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * GET /api/rooms
 * Returns active rooms for the current user's practice, ordered by sort_order.
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
    .from('rooms')
    .select('id, name, room_type, is_active, sort_order')
    .eq('practice_id', practiceId)
    .eq('is_active', true)
    .order('sort_order');

  if (error) return apiError(error);

  return NextResponse.json(data ?? []);
}

/**
 * POST /api/rooms
 * Create a new room. Requires admin.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const admin = createAdminClient();

  const { data: office } = await admin
    .from('offices')
    .select('id')
    .eq('practice_id', practiceId)
    .limit(1)
    .single();
  if (!office) return NextResponse.json({ error: 'No office found' }, { status: 404 });

  const body = await request.json();
  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const { count } = await admin
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('practice_id', practiceId);
  const { data, error } = await admin
    .from('rooms')
    .insert({
      practice_id: practiceId,
      office_id: office.id,
      name: body.name.trim(),
      room_type: body.room_type ?? 'other',
      is_custom: true,
      is_active: body.is_active ?? true,
      sort_order: (count ?? 0) + 1,
    })
    .select('id, name, room_type, is_active, sort_order')
    .single();

  if (error) return apiError(error);

  return NextResponse.json(data, { status: 201 });
}
