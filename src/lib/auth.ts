import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * System-level roles (profiles.role)
 * platform_admin = Renew PMS platform operators
 * practice_admin = Practice owner/manager (highest practice-level role)
 * staff = Practice staff member
 */
export type SystemRole = 'platform_admin' | 'practice_admin' | 'staff';

/**
 * Practice-level roles (practice_members.role)
 * owner > admin > manager > staff > viewer
 */
export type PracticeRole = 'owner' | 'admin' | 'manager' | 'staff' | 'viewer';

/**
 * Permission strings checked by has_practice_permission() in the database.
 */
export type Permission =
  | 'practice.manage'
  | 'practice.settings'
  | 'users.manage'
  | 'users.view'
  | 'patients.manage'
  | 'patients.view'
  | 'schedule.manage'
  | 'schedule.view'
  | 'training.manage'
  | 'training.view'
  | 'training.complete'
  | 'reports.view'
  | 'billing.view'
  | 'billing.manage';

export interface AuthUser {
  user: User;
  profile: {
    id: string;
    system_role: SystemRole;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    email: string | null;
  };
  /** Practice membership context (null if user has no practice membership) */
  membership: {
    department: string | null;
    practice_role: string | null;
  } | null;
}

/**
 * Get the authenticated user and their profile.
 * Returns null if not authenticated or profile not found.
 */
export async function getAuthUser(supabase?: SupabaseClient): Promise<AuthUser | null> {
  const client = supabase ?? await createClient();
  const { data: { user }, error: userError } = await client.auth.getUser();

  if (!user) {
    console.error('[getAuthUser] No user from getUser():', userError?.message);
    return null;
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, system_role, first_name, last_name, full_name, email')
    .eq('id', user.id)
    .single();

  if (!profile) {
    console.error('[getAuthUser] No profile for user:', user.id, profileError?.message);
    return null;
  }

  // Fetch practice membership with department (via role → department FK chain)
  const { data: memberRow } = await client
    .from('practice_members')
    .select('practice_role_types(name, departments(name))')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  // Supabase returns nested FK joins as objects (single) or arrays (many).
  // practice_role_types is a single FK, departments is a single FK off that.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleType = memberRow?.practice_role_types as any as
    | { name: string; departments: { name: string } | null }
    | null;

  return {
    user,
    profile: profile as AuthUser['profile'],
    membership: memberRow
      ? {
          department: roleType?.departments?.name ?? null,
          practice_role: roleType?.name ?? null,
        }
      : null,
  };
}

/**
 * Require authentication. Returns AuthUser or a 401 response.
 */
export async function requireAuth(supabase?: SupabaseClient): Promise<AuthUser | NextResponse> {
  const authUser = await getAuthUser(supabase);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return authUser;
}

/**
 * Require platform admin role. Returns AuthUser or a 401/403 response.
 */
export async function requirePlatformAdmin(supabase?: SupabaseClient): Promise<AuthUser | NextResponse> {
  const result = await requireAuth(supabase);
  if (result instanceof NextResponse) return result;

  if (result.profile.system_role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return result;
}

/**
 * Require practice admin or higher. Returns AuthUser or a 401/403 response.
 */
export async function requirePracticeAdmin(supabase?: SupabaseClient): Promise<AuthUser | NextResponse> {
  const result = await requireAuth(supabase);
  if (result instanceof NextResponse) return result;

  if (!['platform_admin', 'practice_admin'].includes(result.profile.system_role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return result;
}

/**
 * Check if an AuthUser is a platform admin.
 */
export function isPlatformAdmin(authUser: AuthUser): boolean {
  return authUser.profile.system_role === 'platform_admin';
}

/**
 * Type guard: check if a requireAuth result is an error response.
 */
export function isAuthError(result: AuthUser | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
