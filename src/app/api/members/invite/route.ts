import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

type ProfileJoin = { id: string; system_role: string; first_name: string; last_name: string; email: string; phone: string | null; avatar_url: string | null };
type DepartmentJoin = { id: string; name: string; color: string };
type RoleJoin = { id: string; name: string; department_id: string | null; departments: DepartmentJoin | DepartmentJoin[] | null };

function flattenMember(m: {
  id: string;
  user_id: string;
  practice_role_id: string | null;
  employee_type: string;
  shift: string | null;
  is_active: boolean;
  joined_at: string;
  profiles: ProfileJoin | ProfileJoin[] | null;
  practice_role_types: RoleJoin | RoleJoin[] | null;
}) {
  const profile = Array.isArray(m.profiles) ? (m.profiles[0] ?? null) : m.profiles;
  const role = Array.isArray(m.practice_role_types) ? (m.practice_role_types[0] ?? null) : m.practice_role_types;
  const deptRaw = role?.departments ?? null;
  const dept = Array.isArray(deptRaw) ? (deptRaw[0] ?? null) : deptRaw;

  return {
    id: m.id,
    user_id: m.user_id,
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
    email: profile?.email ?? '',
    phone: profile?.phone ?? '',
    avatar_url: profile?.avatar_url ?? null,
    system_role: profile?.system_role ?? 'staff',
    practice_role_id: m.practice_role_id,
    practice_role: role?.name ?? '',
    department_id: role?.department_id ?? null,
    department: dept?.name ?? '',
    department_color: dept?.color ?? '',
    employee_type: m.employee_type,
    shift: m.shift ?? '',
    is_active: m.is_active,
    joined_at: m.joined_at,
  };
}

interface InviteBody {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  system_role?: string;
  practice_role_id?: string | null;
  employee_type?: string;
  shift?: string | null;
}

/**
 * POST /api/members/invite
 *
 * Creates an auth user (or finds existing by email), sets up their profile,
 * and adds them as a practice member. Requires practice_admin or platform_admin.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const body = (await request.json()) as InviteBody;

  if (!body.email?.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }
  if (!body.first_name?.trim()) {
    return NextResponse.json({ error: 'First name is required' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Step 1: Create auth user (or resolve existing by email)
  let userId: string;

  const { data: createData, error: createError } = await admin.auth.admin.createUser({
    email: body.email.trim(),
    email_confirm: true,
    user_metadata: {
      first_name: body.first_name.trim(),
      last_name: body.last_name?.trim() ?? '',
    },
  });

  if (createData?.user) {
    userId = createData.user.id;
  } else if (createError?.message?.includes('already been registered')) {
    // User exists in auth — look up via profiles
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('email', body.email.trim())
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'A user with this email exists in auth but has no profile. Contact support.' },
        { status: 409 },
      );
    }
    userId = existing.id;
  } else {
    console.error('[invite] Failed to create auth user:', createError?.message);
    return NextResponse.json(
      { error: createError?.message ?? 'Failed to create user' },
      { status: 500 },
    );
  }

  // Step 2: Upsert profile with the provided details
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({
      id: userId,
      first_name: body.first_name.trim(),
      last_name: body.last_name?.trim() ?? '',
      email: body.email.trim(),
      phone: body.phone?.trim() ?? null,
      system_role: body.system_role ?? 'staff',
      is_active: true,
    }, { onConflict: 'id' });

  if (profileError) {
    console.error('[invite] Failed to upsert profile:', profileError.message);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Step 3: Create practice_member (duplicate check via unique constraint)
  const { error: memberError } = await admin
    .from('practice_members')
    .insert({
      practice_id: practiceId,
      user_id: userId,
      practice_role_id: body.practice_role_id ?? null,
      employee_type: body.employee_type ?? 'new',
      shift: body.shift ?? null,
      is_active: true,
    });

  if (memberError) {
    if (memberError.code === '23505') {
      return NextResponse.json(
        { error: 'This user is already a member of the practice' },
        { status: 409 },
      );
    }
    console.error('[invite] Failed to create practice_member:', memberError.message);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // Step 4: Return the full member record with joins
  // Use the admin client since the new member row may not be visible via RLS
  // to the requesting user's session yet (depends on policy timing).
  const { data: member, error: fetchError } = await admin
    .from('practice_members')
    .select(`
      id, user_id, practice_role_id, employee_type, shift, is_active, joined_at,
      profiles(id, system_role, first_name, last_name, email, phone, avatar_url),
      practice_role_types(id, name, department_id, departments(id, name, color))
    `)
    .eq('practice_id', practiceId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !member) {
    console.error('[invite] Failed to fetch created member:', fetchError?.message);
    return NextResponse.json({ error: 'User created but failed to fetch member record' }, { status: 500 });
  }

  return NextResponse.json(flattenMember(member), { status: 201 });
}
