'use client';

import { useState, useEffect } from 'react';

export interface EquipmentItem {
  id: string;
  name: string;
  room_id: string | null;
  status: string;
}

export function useEquipment() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/equipment')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load equipment');
        return r.json() as Promise<EquipmentItem[]>;
      })
      .then((data) => {
        setEquipment(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { equipment, loading, error };
}
