/**
 * Shared utility for normalizing Supabase member join results.
 *
 * Supabase sometimes returns single objects as arrays for joined relations.
 * This function safely unwraps the nested structure into a flat Member shape.
 *
 * Used by: GET /api/members, PATCH /api/members/[id], POST /api/members/invite
 */

export type ProfileJoin = {
  id: string;
  system_role: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
};

export type DepartmentJoin = {
  id: string;
  name: string;
  color: string;
};

export type RoleJoin = {
  id: string;
  name: string;
  department_id: string | null;
  departments: DepartmentJoin | DepartmentJoin[] | null;
};

export interface RawMemberRow {
  id: string;
  user_id: string;
  practice_role_id: string | null;
  employee_type: string;
  shift: string | null;
  is_active: boolean;
  joined_at: string;
  profiles: ProfileJoin | ProfileJoin[] | null;
  practice_role_types: RoleJoin | RoleJoin[] | null;
}

export function flattenMember(m: RawMemberRow) {
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
