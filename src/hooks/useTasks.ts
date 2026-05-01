'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  frequency: string | null;
  due_date: string | null;
  type_name: string | null;
  task_type_id: string | null;
  room_name: string | null;
  room_id: string | null;
  equipment_name: string | null;
  equipment_id: string | null;
  supply_category_name: string | null;
  supply_category_id: string | null;
  assigned_to: string;
  assigned_role_id: string | null;
  assigned_department: string | null;
  member_first_name: string;
  member_last_name: string;
  member_role: string;
  member_department: string;
  member_department_color: string;
  checklist_total: number;
  checklist_completed: number;
}

interface UseTasksOptions {
  /** Server-loaded initial data. When provided, the first useEffect fetch
   *  is skipped — subsequent date changes or refetch() calls fetch normally. */
  initialData?: TaskRow[];
  /** When true, include completed/skipped tasks in the response. Drives the
   *  "Show resolved" toggle on the board. Flipping this triggers a refetch. */
  includeResolved?: boolean;
}

export function useTasks(date?: Date, options?: UseTasksOptions) {
  const hasInitial = options?.initialData !== undefined;
  const includeResolved = options?.includeResolved ?? false;
  const [tasks, setTasks] = useState<TaskRow[]>(options?.initialData ?? []);
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const skipNextFetch = useRef(hasInitial);

  const refetch = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    const d = date ?? new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const url = `/api/tasks?date=${dateStr}${includeResolved ? '&includeResolved=true' : ''}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setTasks(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message ?? 'Failed to load tasks');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [date, refreshKey, includeResolved]);

  return { tasks, loading, error, refetch };
}
