import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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

  // Delete all existing items for this template
  const { error: deleteError } = await supabase
    .from('checklist_items')
    .delete()
    .eq('template_id', id)
    .eq('practice_id', practiceId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  if (body.length === 0) return NextResponse.json([]);

  const rows = body.map((item, idx) => ({
    template_id: id,
    practice_id: practiceId,
    label: item.label,
    sort_order: idx,
    room_id: item.room_id || null,
    equipment_id: item.equipment_id || null,
    supply_category_id: item.supply_category_id || null,
  }));

  const { data, error } = await supabase
    .from('checklist_items')
    .insert(rows)
    .select('id, label, sort_order, room_id, equipment_id, supply_category_id');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
