'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TaskRow } from './useTasks';

/** Pool task row — same shape as TaskRow but assigned_to is always empty */
export type PoolTaskRow = TaskRow;

export function usePoolTasks(date?: Date) {
  const [tasks, setTasks] = useState<PoolTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const d = date ?? new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    fetch(`/api/tasks?date=${dateStr}&pool=true`)
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
  }, [date, refreshKey]);

  return { tasks, loading, error, refetch };
}
