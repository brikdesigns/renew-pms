import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * GET /api/tasks/[id]/checklist
 * Returns checklist items for a task, ordered by sort_order.
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
    .from('task_checklist_items')
    .select('id, label, sort_order, is_completed, completed_at, room_id, equipment_id, supply_category_id')
    .eq('task_id', id)
    .eq('practice_id', practiceId)
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

/**
 * PATCH /api/tasks/[id]/checklist
 * Toggle completion state on one or more checklist items.
 * Body: { items: [{ id: string, is_completed: boolean }] }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const body = await request.json() as { items: Array<{ id: string; is_completed: boolean }> };

  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: 'items array is required' }, { status: 400 });
  }

  // Update each item
  for (const item of body.items) {
    await supabase
      .from('task_checklist_items')
      .update({
        is_completed: item.is_completed,
        completed_at: item.is_completed ? new Date().toISOString() : null,
        completed_by: item.is_completed ? authUser.profile.id : null,
      })
      .eq('id', item.id)
      .eq('task_id', id)
      .eq('practice_id', practiceId);
  }

  // Return fresh list
  const { data } = await supabase
    .from('task_checklist_items')
    .select('id, label, sort_order, is_completed, completed_at, room_id, equipment_id, supply_category_id')
    .eq('task_id', id)
    .eq('practice_id', practiceId)
    .order('sort_order');

  // Also suppress the unused variable warning for the route param
  void id;

  return NextResponse.json(data ?? []);
}
