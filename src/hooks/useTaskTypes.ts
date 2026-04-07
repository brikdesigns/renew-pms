'use client';

import { useState, useEffect } from 'react';

export interface TaskType {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
}

export function useTaskTypes() {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/task-types')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setTaskTypes(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { taskTypes, loading };
}
