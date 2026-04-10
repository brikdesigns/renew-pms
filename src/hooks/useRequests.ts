'use client';

import { useState, useEffect, useCallback } from 'react';

export interface RequestRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  urgency: string;
  status: string;
  location_description: string | null;
  room_id: string | null;
  room_name: string | null;
  equipment_id: string | null;
  equipment_name: string | null;
  vendor_id: string | null;
  vendor_name: string | null;
  vendor_type: string | null;
  vendor_contact_id: string | null;
  vendor_contact_name: string | null;
  vendor_contact_phone: string | null;
  vendor_contact_email: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  submitter_id: string | null;
  submitter_name: string | null;
  submitter_role: string | null;
  submitter_department: string | null;
  submitter_department_color: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
}

interface UseRequestsFilters {
  status?: string;
  category?: string;
  urgency?: string;
  /** Pass practice_member ID to filter to only submitted/assigned requests */
  mine?: string;
}

export function useRequests(filters?: UseRequestsFilters) {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.urgency) params.set('urgency', filters.urgency);
    if (filters?.mine) params.set('mine', filters.mine);

    fetch(`/api/requests?${params}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setRequests(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message ?? 'Failed to load requests');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [filters?.status, filters?.category, filters?.urgency, filters?.mine, refreshKey]);

  /** Optimistically patch a request in local state (before API confirms). */
  const updateOptimistic = useCallback((id: string, updates: Partial<RequestRow>) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  return { requests, loading, error, refetch, updateOptimistic };
}
