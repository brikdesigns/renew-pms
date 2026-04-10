import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * GET /api/equipment/[id]
 * Returns a single equipment item (same shape as the list endpoint).
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
    .from('equipment')
    .select(`
      id, name, room_id, status, manufacturer, notes,
      equipment_categories(name),
      rooms(name)
    `)
    .eq('id', id)
    .eq('practice_id', practiceId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catRaw = data.equipment_categories as any;
  const cat = (Array.isArray(catRaw) ? catRaw[0] : catRaw) as { name: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomRaw = data.rooms as any;
  const room = (Array.isArray(roomRaw) ? roomRaw[0] : roomRaw) as { name: string } | null;

  return NextResponse.json({
    id: data.id,
    name: data.name,
    room_id: data.room_id,
    room_name: room?.name ?? null,
    status: data.status,
    manufacturer: data.manufacturer ?? null,
    description: data.notes ?? null,
    category: cat?.name ?? null,
  });
}

/**
 * PATCH /api/equipment/[id]
 * Update an equipment item. Requires admin.
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
  const allowed = ['name', 'manufacturer', 'room_id', 'equipment_category_id', 'status', 'notes', 'is_active'] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('equipment')
    .update(updates)
    .eq('id', id)
    .eq('practice_id', practiceId)
    .select('id, name, room_id, status, manufacturer, notes, equipment_categories(name), rooms(name)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catRaw = data.equipment_categories as any;
  const cat = (Array.isArray(catRaw) ? catRaw[0] : catRaw) as { name: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomRaw = data.rooms as any;
  const rm = (Array.isArray(roomRaw) ? roomRaw[0] : roomRaw) as { name: string } | null;

  return NextResponse.json({
    id: data.id,
    name: data.name,
    room_id: data.room_id,
    room_name: rm?.name ?? null,
    status: data.status,
    manufacturer: data.manufacturer ?? null,
    description: data.notes ?? null,
    category: cat?.name ?? null,
  });
}

/**
 * DELETE /api/equipment/[id]
 * Soft-delete (deactivate) an equipment item. Requires admin.
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

  const admin = createAdminClient();
  const { error } = await admin
    .from('equipment')
    .update({ is_active: false })
    .eq('id', id)
    .eq('practice_id', practiceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
