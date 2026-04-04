'use client';

import { useState, useEffect } from 'react';

export interface SupplyCategory {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
}

export function useSupplyCategories() {
  const [supplyCategories, setSupplyCategories] = useState<SupplyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/supply-categories')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load supply categories');
        return r.json() as Promise<SupplyCategory[]>;
      })
      .then((data) => {
        setSupplyCategories(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { supplyCategories, loading, error };
}
