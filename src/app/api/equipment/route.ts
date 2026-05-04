import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-errors';
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

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('equipment')
    .select(`
      id, name, room_id, vendor_id, department_id, team_id, status, manufacturer, notes,
      equipment_categories(name),
      rooms(name),
      vendors(name),
      departments(name, color),
      teams(name)
    `)
    .eq('practice_id', practiceId)
    .eq('is_active', true)
    .order('name');

  if (error) return apiError(error);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const first = (v: any) => (Array.isArray(v) ? v[0] ?? null : v);

  const result = (data ?? []).map((e) => {
    const cat = first(e.equipment_categories) as { name: string } | null;
    const room = first(e.rooms) as { name: string } | null;
    const vendor = first(e.vendors) as { name: string } | null;
    const dept = first(e.departments) as { name: string; color: string } | null;
    const team = first(e.teams) as { name: string } | null;
    return {
      id: e.id,
      name: e.name,
      room_id: e.room_id,
      room_name: room?.name ?? null,
      vendor_id: e.vendor_id,
      vendor_name: vendor?.name ?? null,
      department_id: e.department_id,
      department_name: dept?.name ?? null,
      department_color: dept?.color ?? null,
      team_id: e.team_id,
      team_name: team?.name ?? null,
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

  const admin = createAdminClient();

  // Resolve office_id (single-office model)
  const { data: office } = await admin
    .from('offices')
    .select('id')
    .eq('practice_id', practiceId)
    .limit(1)
    .single();
  if (!office) return NextResponse.json({ error: 'No office found' }, { status: 404 });

  const body = await request.json();
  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  const { data, error } = await admin
    .from('equipment')
    .insert({
      practice_id: practiceId,
      office_id: office.id,
      name: body.name.trim(),
      manufacturer: body.manufacturer?.trim() || null,
      room_id: body.room_id || null,
      vendor_id: body.vendor_id || null,
      department_id: body.department_id || null,
      team_id: body.team_id || null,
      equipment_category_id: body.equipment_category_id || null,
      status: body.status ?? 'active',
      notes: body.notes?.trim() || null,
      created_by: authUser.profile.id,
    })
    .select('id, name, room_id, vendor_id, department_id, team_id, status, manufacturer, notes')
    .single();

  if (error) return apiError(error);

  return NextResponse.json({
    id: data.id,
    name: data.name,
    room_id: data.room_id,
    room_name: null,
    vendor_id: data.vendor_id,
    vendor_name: null,
    department_id: data.department_id,
    department_name: null,
    department_color: null,
    team_id: data.team_id,
    team_name: null,
    status: data.status,
    manufacturer: data.manufacturer,
    description: data.notes,
    category: null,
  }, { status: 201 });
}
