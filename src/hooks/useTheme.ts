'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'renew-theme-mode';

export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark') {
      setIsDark(true);
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else if (stored === 'light') {
      setIsDark(false);
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
    // If no stored preference, system preference via @media query handles it
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.body.classList.toggle('dark', next);
      document.body.classList.toggle('light', !next);
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return { isDark, toggle };
}
