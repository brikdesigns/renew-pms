import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

  if (error) return apiError(error);

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

  const admin = createAdminClient();

  // Update each item
  for (const item of body.items) {
    await admin
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
  const { data } = await admin
    .from('task_checklist_items')
    .select('id, label, sort_order, is_completed, completed_at, room_id, equipment_id, supply_category_id')
    .eq('task_id', id)
    .eq('practice_id', practiceId)
    .order('sort_order');

  // Roll up to parent task.status. If every checklist item is now complete,
  // mark the parent task complete; if a previously-complete task now has any
  // incomplete item, revert to in_progress. Without this, completing a task
  // through the checklist UI leaves tasks.status stale and the task reappears
  // on the board after refresh.
  const items = data ?? [];
  if (items.length > 0) {
    const allComplete = items.every((i) => i.is_completed);
    const { data: parent } = await admin
      .from('tasks')
      .select('status')
      .eq('id', id)
      .eq('practice_id', practiceId)
      .maybeSingle();

    if (parent) {
      const parentStatus = parent.status as string;
      if (allComplete && parentStatus !== 'completed' && parentStatus !== 'skipped') {
        await admin
          .from('tasks')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', id)
          .eq('practice_id', practiceId);
      } else if (!allComplete && parentStatus === 'completed') {
        await admin
          .from('tasks')
          .update({ status: 'in_progress', completed_at: null })
          .eq('id', id)
          .eq('practice_id', practiceId);
      }
    }
  }

  return NextResponse.json(items);
}
