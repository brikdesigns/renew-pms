'use client';

import { useState, useEffect } from 'react';

export interface Role {
  id: string;
  name: string;
  description: string;
  default_system_role: string;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  department_id: string | null;
  department: string;
  department_color: string;
  member_count: number;
}

/**
 * Fetches practice role types for the current user's practice from /api/roles.
 * Shared by settings table, role dropdowns, and display pages.
 */
export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/roles')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load roles');
        return r.json() as Promise<Role[]>;
      })
      .then((data) => {
        setRoles(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { roles, setRoles, loading, error };
}
