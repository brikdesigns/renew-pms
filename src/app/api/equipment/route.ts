import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * GET /api/equipment
 * Returns active equipment for the current user's practice.
 * Slim payload — id, name, room_id only (used for checklist item pickers).
 */
export async function GET() {
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
    .eq('practice_id', practiceId)
    .eq('is_active', true)
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (data ?? []).map((e) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const catRaw = e.equipment_categories as any;
    const cat = (Array.isArray(catRaw) ? catRaw[0] : catRaw) as { name: string } | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roomRaw = e.rooms as any;
    const room = (Array.isArray(roomRaw) ? roomRaw[0] : roomRaw) as { name: string } | null;
    return {
      id: e.id,
      name: e.name,
      room_id: e.room_id,
      room_name: room?.name ?? null,
      status: e.status,
      manufacturer: e.manufacturer ?? null,
      description: e.notes ?? null,
      category: cat?.name ?? null,
    };
  });

  return NextResponse.json(result);
}

/**
 * POST /api/equipment
 * Create a new equipment item. Requires admin.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  // Resolve office_id (single-office model)
  const { data: office } = await supabase
    .from('offices')
    .select('id')
    .eq('practice_id', practiceId)
    .limit(1)
    .single();
  if (!office) return NextResponse.json({ error: 'No office found' }, { status: 404 });

  const body = await request.json();
  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('equipment')
    .insert({
      practice_id: practiceId,
      office_id: office.id,
      name: body.name.trim(),
      manufacturer: body.manufacturer?.trim() || null,
      room_id: body.room_id || null,
      equipment_category_id: body.equipment_category_id || null,
      status: body.status ?? 'active',
      notes: body.notes?.trim() || null,
      created_by: authUser.profile.id,
    })
    .select('id, name, room_id, status, manufacturer, notes')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    id: data.id,
    name: data.name,
    room_id: data.room_id,
    room_name: null,
    status: data.status,
    manufacturer: data.manufacturer,
    description: data.notes,
    category: null,
  }, { status: 201 });
}
