'use client';

import { useState, useEffect } from 'react';

export interface ComplianceType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export function useComplianceTypes() {
  const [complianceTypes, setComplianceTypes] = useState<ComplianceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/compliance-types')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load compliance types');
        return r.json() as Promise<ComplianceType[]>;
      })
      .then((data) => {
        setComplianceTypes(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { complianceTypes, loading, error };
}
