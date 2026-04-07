'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  start: string;
  end: string;
  allDay: boolean;
  eventType: string;
  color: string | null;
  staffId: string | null;
  staffName: string | null;
  staffRole: string | null;
  staffDepartment: string | null;
  staffDepartmentColor: string | null;
}

export function useScheduleEvents(start?: string, end?: string) {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);

    try {
      const res = await fetch(`/api/schedule?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load events');
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}
