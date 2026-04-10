import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * GET /api/teams
 * Returns all teams for the current practice with member counts.
 */
export async function GET() {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const { data, error } = await supabase
    .from('teams')
    .select(`
      id, name, department_id, is_active, sort_order, created_at,
      departments(name, color)
    `)
    .eq('practice_id', practiceId)
    .order('sort_order')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Count members per team
  const { data: memberCounts } = await supabase
    .from('practice_members')
    .select('team_id')
    .eq('practice_id', practiceId)
    .eq('is_active', true)
    .not('team_id', 'is', null);

  const countMap = new Map<string, number>();
  for (const m of memberCounts ?? []) {
    if (m.team_id) countMap.set(m.team_id, (countMap.get(m.team_id) ?? 0) + 1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (data ?? []).map((t: any) => {
    const dept = Array.isArray(t.departments) ? t.departments[0] : t.departments;
    return {
      id: t.id,
      name: t.name,
      department_id: t.department_id,
      department_name: dept?.name ?? null,
      department_color: dept?.color ?? null,
      is_active: t.is_active,
      sort_order: t.sort_order,
      member_count: countMap.get(t.id) ?? 0,
    };
  });

  return NextResponse.json(result);
}

/**
 * POST /api/teams
 * Create a new team. Admin only.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const body = await request.json();
  const { name, department_id, is_active } = body;

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('teams')
    .insert({
      practice_id: practiceId,
      name: name.trim(),
      department_id: department_id || null,
      is_active: is_active ?? true,
    })
    .select('id, name, department_id, is_active, sort_order')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ...data, department_name: null, department_color: null, member_count: 0 });
}
