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
    role: SystemRole;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    email: string | null;
  };
}

/**
 * Get the authenticated user and their profile.
 * Returns null if not authenticated or profile not found.
 */
export async function getAuthUser(supabase?: SupabaseClient): Promise<AuthUser | null> {
  const client = supabase ?? await createClient();
  const { data: { user } } = await client.auth.getUser();

  if (!user) return null;

  const { data: profile } = await client
    .from('profiles')
    .select('id, role, first_name, last_name, full_name, email')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    user,
    profile: profile as AuthUser['profile'],
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

  if (result.profile.role !== 'platform_admin') {
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

  if (!['platform_admin', 'practice_admin'].includes(result.profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return result;
}

/**
 * Check if an AuthUser is a platform admin.
 */
export function isPlatformAdmin(authUser: AuthUser): boolean {
  return authUser.profile.role === 'platform_admin';
}

/**
 * Type guard: check if a requireAuth result is an error response.
 */
export function isAuthError(result: AuthUser | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
