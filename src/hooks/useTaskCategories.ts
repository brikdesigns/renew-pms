'use client';

import { useState, useEffect } from 'react';

export interface TaskCategory {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
}

export function useTaskCategories() {
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/task-categories')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load task categories');
        return r.json() as Promise<TaskCategory[]>;
      })
      .then((data) => {
        setTaskCategories(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { taskCategories, loading, error };
}
