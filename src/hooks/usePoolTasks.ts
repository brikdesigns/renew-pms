'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TaskRow } from './useTasks';

/** Pool task row — same shape as TaskRow but assigned_to is always empty */
export type PoolTaskRow = TaskRow;

interface UsePoolTasksOptions {
  /** Server-loaded initial data. When provided, the first useEffect fetch
   *  is skipped — subsequent date changes or refetch() calls fetch normally. */
  initialData?: PoolTaskRow[];
  /** When true, include completed/skipped pool tasks. Drives the "Show
   *  resolved" toggle. Flipping it triggers a refetch. */
  includeResolved?: boolean;
}

export function usePoolTasks(date?: Date, options?: UsePoolTasksOptions) {
  const hasInitial = options?.initialData !== undefined;
  const includeResolved = options?.includeResolved ?? false;
  const [tasks, setTasks] = useState<PoolTaskRow[]>(options?.initialData ?? []);
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
    const url = `/api/tasks?date=${dateStr}&pool=true${includeResolved ? '&includeResolved=true' : ''}`;

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
          setError(err.message ?? 'Failed to load pool tasks');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [date, refreshKey, includeResolved]);

  return { tasks, loading, error, refetch };
}
