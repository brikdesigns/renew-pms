'use client';

import { useState, useEffect, useCallback } from 'react';

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
}

export function useTasks(date?: Date) {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
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

    fetch(`/api/tasks?date=${dateStr}`)
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
  }, [date, refreshKey]);

  return { tasks, loading, error, refetch };
}
