import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * GET /api/templates
 * Returns all task_templates for the current user's practice,
 * with their checklist_items joined.
 */
export async function GET() {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const { data, error } = await supabase
    .from('task_templates')
    .select(`
      id, name, description, type, frequency, priority, status,
      requires_approval, estimated_duration, is_default,
      task_category_id, compliance_type_id, room_id,
      assigned_role_id, department_id,
      created_at, updated_at,
      checklist_items (
        id, label, sort_order,
        room_id, equipment_id, supply_category_id
      )
    `)
    .eq('practice_id', practiceId)
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

/**
 * POST /api/templates
 * Creates a new template (without items — items are managed via /api/templates/[id]/items).
 */
export async function POST(request: Request) {
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

  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!body.type) return NextResponse.json({ error: 'Type is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('task_templates')
    .insert({
      practice_id: practiceId,
      name: body.name.trim(),
      description: body.description ?? null,
      type: body.type,
      task_category_id: body.task_category_id || null,
      compliance_type_id: body.compliance_type_id || null,
      room_id: body.room_id || null,
      assigned_role_id: body.assigned_role_id || null,
      department_id: body.department_id || null,
      frequency: body.frequency || null,
      priority: body.priority ?? 'medium',
      estimated_duration: body.estimated_duration ?? null,
      requires_approval: body.requires_approval ?? false,
      status: body.status ?? 'draft',
      created_by: authUser.profile.id,
    })
    .select('id, name, description, type, frequency, priority, status, requires_approval, estimated_duration, is_default, task_category_id, compliance_type_id, room_id, assigned_role_id, department_id, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ...data, checklist_items: [] }, { status: 201 });
}
