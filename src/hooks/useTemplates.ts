'use client';

import { useState, useEffect } from 'react';

export interface ChecklistItem {
  id: string;
  label: string;
  sort_order: number;
  room_id: string | null;
  equipment_id: string | null;
  supply_category_id: string | null;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  type: string;
  task_category_id: string | null;
  compliance_type_id: string | null;
  room_id: string | null;
  assigned_member_id: string | null;
  assigned_role_id: string | null;
  department_id: string | null;
  frequency: string | null;
  priority: string;
  estimated_duration: number | null;
  requires_approval: boolean;
  status: string;
  assignment_mode: string;
  display_mode: string;
  task_reset_cadence: string | null;
  is_default: boolean;
  checklist_items: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load templates');
        return r.json() as Promise<TaskTemplate[]>;
      })
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        console.error('[useTemplates] failed to load:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { templates, setTemplates, loading, error };
}
