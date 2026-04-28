'use client';

import { useState, useEffect, useRef } from 'react';

export interface Department {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  member_count: number;
}

interface UseDepartmentsOptions {
  /** Server-loaded initial data. When provided, the first useEffect fetch
   *  is skipped. Setters and subsequent renders work as usual. */
  initialData?: Department[];
}

/**
 * Fetches departments for the current user's practice from /api/departments.
 * Shared by settings table, task/training filter bars, and display pages.
 */
export function useDepartments(options?: UseDepartmentsOptions) {
  const hasInitial = options?.initialData !== undefined;
  const [departments, setDepartments] = useState<Department[]>(options?.initialData ?? []);
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState<string | null>(null);
  const skipNextFetch = useRef(hasInitial);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
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
        console.error('[useDepartments] fetch failed:', err.message);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { departments, setDepartments, loading, error };
}
