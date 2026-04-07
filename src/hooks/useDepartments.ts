'use client';

import { useState, useEffect } from 'react';

export interface Department {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  member_count: number;
}

/**
 * Fetches departments for the current user's practice from /api/departments.
 * Shared by settings table, task/training filter bars, and display pages.
 */
export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/departments')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load departments');
        return r.json() as Promise<Department[]>;
      })
      .then((data) => {
        setDepartments(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { departments, setDepartments, loading, error };
}
