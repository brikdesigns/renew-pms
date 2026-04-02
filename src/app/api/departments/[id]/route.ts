import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

async function getPracticeId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('practice_members')
    .select('practice_id')
    .eq('user_id', userId)
    .limit(1)
    .single();
  return data?.practice_id ?? null;
}

/**
 * PATCH /api/departments/[id]
 * Updates a department's name, color, is_active, or sort_order.
 * Requires practice_admin or platform_admin.
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

  const practiceId = await getPracticeId(supabase, authUser.profile.id);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const body = await request.json();
  const allowed = ['name', 'color', 'is_active', 'sort_order'] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('departments')
    .update(updates)
    .eq('id', id)
    .eq('practice_id', practiceId)
    .select('id, name, color, is_active, sort_order')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A department with that name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...data, member_count: 0 });
}

/**
 * DELETE /api/departments/[id]
 * Deletes a department. Requires practice_admin or platform_admin.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser.profile.id);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id)
    .eq('practice_id', practiceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
