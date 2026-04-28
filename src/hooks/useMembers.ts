'use client';

import { useState, useEffect, useRef } from 'react';

export interface Member {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  system_role: string;
  practice_role_id: string | null;
  practice_role: string;
  department_id: string | null;
  department: string;
  department_color: string;
  employee_type: string;
  shift: string;
  is_active: boolean;
  joined_at: string;
  /** True iff the user has logged in at least once (auth.users.last_sign_in_at != null).
   *  Optional because endpoints that mutate a single member (PATCH, invite response) don't
   *  re-query auth state. Treat undefined as "unknown — don't render auth-specific UI". */
  has_signed_in?: boolean;
}

interface UseMembersOptions {
  /** Server-loaded initial data. When provided, the first useEffect fetch
   *  is skipped. Setters and subsequent renders work as usual. */
  initialData?: Member[];
}

export function useMembers(options?: UseMembersOptions) {
  const hasInitial = options?.initialData !== undefined;
  const [members, setMembers] = useState<Member[]>(options?.initialData ?? []);
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState<string | null>(null);
  const skipNextFetch = useRef(hasInitial);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch('/api/members')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setMembers(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? 'Failed to load members');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  return { members, setMembers, loading, error };
}
