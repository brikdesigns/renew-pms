import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
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
