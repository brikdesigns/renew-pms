'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'renew-theme-mode';

/**
 * Resolve the currently-visible theme from the DOM and environment, in
 * priority order:
 *   1. body.classList — explicit user choice persisted via toggle()
 *   2. localStorage — last stored choice, in case the class hasn't been set yet
 *   3. (prefers-color-scheme: dark) — system preference; lines up with the
 *      @media-driven token overrides when nothing else is set
 *
 * Reading from the DOM/environment makes toggle() authoritative on what the
 * user *sees*, not what React state happens to be. Earlier code initialized
 * `useState(false)` and only synced from storage in useEffect — a click that
 * landed before the effect ran could be a no-op for users already in dark
 * mode via system preference, requiring multiple clicks to "activate".
 */
function resolveCurrentDark(): boolean {
  if (typeof window === 'undefined') return false;
  if (document.body.classList.contains('dark')) return true;
  if (document.body.classList.contains('light')) return false;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark') return true;
  if (stored === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

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
    } else {
      // No stored preference — sync state to system preference so the toggle
      // button label matches what the user actually sees on screen.
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  const toggle = useCallback(() => {
    const next = !resolveCurrentDark();
    setIsDark(next);
    document.body.classList.toggle('dark', next);
    document.body.classList.toggle('light', !next);
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
  }, []);

  return { isDark, toggle };
}
