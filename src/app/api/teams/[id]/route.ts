import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * GET /api/teams/[id]
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
    .from('teams')
    .select('id, name, department_id, is_active, sort_order, departments(name, color)')
    .eq('id', id)
    .eq('practice_id', practiceId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dept = Array.isArray(data.departments) ? (data.departments as any)[0] : data.departments;

  return NextResponse.json({
    id: data.id,
    name: data.name,
    department_id: data.department_id,
    department_name: dept?.name ?? null,
    department_color: dept?.color ?? null,
    is_active: data.is_active,
    sort_order: data.sort_order,
    member_count: 0,
  });
}

/**
 * PATCH /api/teams/[id]
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
  const updates: Record<string, unknown> = {};
  if ('name' in body) updates.name = body.name;
  if ('department_id' in body) updates.department_id = body.department_id || null;
  if ('is_active' in body) updates.is_active = body.is_active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', id)
    .eq('practice_id', practiceId)
    .select('id, name, department_id, is_active, sort_order, departments(name, color)')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dept = Array.isArray(data.departments) ? (data.departments as any)[0] : data.departments;

  return NextResponse.json({
    id: data.id,
    name: data.name,
    department_id: data.department_id,
    department_name: dept?.name ?? null,
    department_color: dept?.color ?? null,
    is_active: data.is_active,
    sort_order: data.sort_order,
    member_count: 0,
  });
}

/**
 * DELETE /api/teams/[id]
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
    .from('teams')
    .delete()
    .eq('id', id)
    .eq('practice_id', practiceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
