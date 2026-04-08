import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

// ─── Join types ─────────────────────────────────────────────────────────────

type ProfileJoin = { first_name: string; last_name: string };
type DepartmentJoin = { name: string; color: string };
type RoleJoin = { name: string; departments: DepartmentJoin | DepartmentJoin[] | null };
type MemberJoin = {
  id: string;
  profiles: ProfileJoin | ProfileJoin[] | null;
  practice_role_types: RoleJoin | RoleJoin[] | null;
};

interface RawEvent {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  event_type: string;
  color: string | null;
  assigned_to: string | null;
  practice_members: MemberJoin | MemberJoin[] | null;
}

function flattenEvent(e: RawEvent) {
  const member = Array.isArray(e.practice_members) ? (e.practice_members[0] ?? null) : e.practice_members;
  const profile = member ? (Array.isArray(member.profiles) ? (member.profiles[0] ?? null) : member.profiles) : null;
  const role = member ? (Array.isArray(member.practice_role_types) ? (member.practice_role_types[0] ?? null) : member.practice_role_types) : null;
  const deptRaw = role?.departments ?? null;
  const dept = Array.isArray(deptRaw) ? (deptRaw[0] ?? null) : deptRaw;

  return {
    id: e.id,
    title: e.title,
    description: e.description,
    start: e.start_at,
    end: e.end_at,
    allDay: e.all_day,
    eventType: e.event_type,
    color: e.color,
    staffId: member?.id ?? null,
    staffName: profile ? `${profile.first_name} ${profile.last_name}`.trim() : null,
    staffRole: role?.name ?? null,
    staffDepartment: dept?.name ?? null,
    staffDepartmentColor: dept?.color ?? null,
  };
}

/**
 * GET /api/schedule?start=ISO&end=ISO
 * Returns schedule events within the date range, with staff info.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  let query = supabase
    .from('schedule_events')
    .select(`
      id, title, description, start_at, end_at, all_day, event_type, color,
      assigned_to,
      practice_members(
        id,
        profiles(first_name, last_name),
        practice_role_types(name, departments(name, color))
      )
    `)
    .eq('practice_id', practiceId)
    .order('start_at', { ascending: true });

  // Filter by date range if provided
  if (start) query = query.gte('start_at', start);
  if (end) query = query.lte('end_at', end);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map(flattenEvent));
}

/**
 * POST /api/schedule
 * Create a new schedule event.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const body = await request.json();

  const { data, error } = await supabase
    .from('schedule_events')
    .insert({
      practice_id: practiceId,
      title: body.title,
      description: body.description ?? null,
      start_at: body.start,
      end_at: body.end,
      all_day: body.allDay ?? false,
      event_type: body.eventType ?? 'general',
      assigned_to: body.assignedTo ?? null,
      assigned_department: body.assignedDepartment ?? null,
      room_id: body.roomId ?? null,
      color: body.color ?? null,
      created_by: authUser.profile.id,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
