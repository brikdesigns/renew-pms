import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * PUT /api/templates/[id]
 * Updates a template's fields (not items — use /items for that).
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

  const body = await request.json() as {
    name?: string;
    description?: string;
    type?: string;
    task_category_id?: string | null;
    compliance_type_id?: string | null;
    room_id?: string | null;
    assigned_role_id?: string | null;
    department_id?: string | null;
    frequency?: string | null;
    priority?: string;
    estimated_duration?: number | null;
    requires_approval?: boolean;
    status?: string;
  };

  const { data, error } = await supabase
    .from('task_templates')
    .update({
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.task_category_id !== undefined && { task_category_id: body.task_category_id || null }),
      ...(body.compliance_type_id !== undefined && { compliance_type_id: body.compliance_type_id || null }),
      ...(body.room_id !== undefined && { room_id: body.room_id || null }),
      ...(body.assigned_role_id !== undefined && { assigned_role_id: body.assigned_role_id || null }),
      ...(body.department_id !== undefined && { department_id: body.department_id || null }),
      ...(body.frequency !== undefined && { frequency: body.frequency || null }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.estimated_duration !== undefined && { estimated_duration: body.estimated_duration }),
      ...(body.requires_approval !== undefined && { requires_approval: body.requires_approval }),
      ...(body.status !== undefined && { status: body.status }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('practice_id', practiceId)
    .select('id, name, description, type, frequency, priority, status, requires_approval, estimated_duration, is_default, task_category_id, compliance_type_id, room_id, assigned_role_id, department_id, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  return NextResponse.json(data);
}

/**
 * DELETE /api/templates/[id]
 * Deletes a template. Default (is_default=true) templates cannot be deleted.
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

  const { error } = await supabase
    .from('task_templates')
    .delete()
    .eq('id', id)
    .eq('practice_id', practiceId)
    .eq('is_default', false); // RLS also enforces this; belt-and-suspenders

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
