'use client';

import { useState, useEffect } from 'react';

export interface Vendor {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/vendors')
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setVendors(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { vendors, loading };
}
