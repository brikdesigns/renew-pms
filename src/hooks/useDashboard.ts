'use client';

import { useState, useEffect } from 'react';

export interface OverdueTask {
  id: string;
  title: string;
  priority: string;
  assignee: string;
  dept: string;
  deptColor: string;
}

export interface DeptCompletion {
  completed: number;
  total: number;
  color: string;
}

export interface RecentRequest {
  id: string;
  title: string;
  category: string;
  urgency: string;
  status: string;
  updatedAt: string;
  submitter: string;
  dept: string;
  deptColor: string;
}

export interface DashboardData {
  overdueTasks: OverdueTask[];
  todayProgress: { completed: number; total: number };
  departmentCompletion: Record<string, DeptCompletion>;
  recentRequests: RecentRequest[];
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/dashboard')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load dashboard data');
        return r.json() as Promise<DashboardData>;
      })
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
