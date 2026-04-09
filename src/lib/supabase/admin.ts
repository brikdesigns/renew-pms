import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with the service role key.
 * Bypasses RLS — use only in server-side API routes for admin operations
 * (e.g. creating auth users, cross-practice queries).
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in environment.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY — required for admin operations');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
