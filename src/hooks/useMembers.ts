'use client';

import { useState, useEffect } from 'react';

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
}

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
