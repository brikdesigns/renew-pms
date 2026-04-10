'use client';

import { useState, useEffect } from 'react';

export interface Team {
  id: string;
  name: string;
  department_id: string | null;
  department_name: string | null;
  department_color: string | null;
  is_active: boolean;
  sort_order: number;
  member_count: number;
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/teams')
      .then((r) => r.json() as Promise<Team[]>)
      .then((data) => { setTeams(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  return { teams, setTeams, loading, error };
}
