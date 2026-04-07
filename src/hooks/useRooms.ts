'use client';

import { useState, useEffect } from 'react';

export interface Room {
  id: string;
  name: string;
  room_type: string;
  is_active: boolean;
  sort_order: number;
}

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/rooms')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load rooms');
        return r.json() as Promise<Room[]>;
      })
      .then((data) => {
        setRooms(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { rooms, loading, error };
}
