import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * GET /api/templates/[id]/items
 * Returns all checklist items for a template, ordered by sort_order.
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
    .from('checklist_items')
    .select('id, label, sort_order, room_id, equipment_id, supply_category_id')
    .eq('template_id', id)
    .eq('practice_id', practiceId)
    .order('sort_order');

  if (error) return apiError(error);

  return NextResponse.json(data ?? []);
}

/**
 * PUT /api/templates/[id]/items
 * Full replace: deletes existing items for the template and inserts the new set.
 * Accepts an ordered array of items; sort_order is assigned by position.
 */
export async function PUT(
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

  const body = await request.json() as Array<{
    label: string;
    room_id?: string | null;
    equipment_id?: string | null;
    supply_category_id?: string | null;
  }>;

  if (!Array.isArray(body)) {
    return NextResponse.json({ error: 'Body must be an array of items' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Delete all existing items for this template
  const { error: deleteError } = await admin
    .from('checklist_items')
    .delete()
    .eq('template_id', id)
    .eq('practice_id', practiceId);

  if (deleteError) return apiError(deleteError);

  let data: Array<{ id: string; label: string; sort_order: number; room_id: string | null; equipment_id: string | null; supply_category_id: string | null }> | null = [];
  if (body.length > 0) {
    const rows = body.map((item, idx) => ({
      template_id: id,
      practice_id: practiceId,
      label: item.label,
      sort_order: idx,
      room_id: item.room_id || null,
      equipment_id: item.equipment_id || null,
      supply_category_id: item.supply_category_id || null,
    }));

    const { data: inserted, error } = await admin
      .from('checklist_items')
      .insert(rows)
      .select('id, label, sort_order, room_id, equipment_id, supply_category_id');

    if (error) return apiError(error);
    data = inserted;
  }

  // Spawn today's task instance(s) AFTER items are written. Moved here from
  // POST /api/templates (which fired before items existed → race that left
  // today's task with 0 task_checklist_items). The generator is idempotent
  // on (template_id, today) and gated SQL-side on assignment-mode + FK
  // presence, so it's safe to call regardless of body.length or template
  // shape — no-op if nothing needs spawning.
  const { error: spawnError } = await admin.rpc('generate_daily_tasks', { p_practice_id: practiceId });
  if (spawnError) {
    console.error('[templates/items] generate_daily_tasks failed:', spawnError);
  }

  return NextResponse.json(data ?? []);
}
