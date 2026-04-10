import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/health — unauthenticated DB connectivity check.
 * Uses service role to bypass RLS and verify the schema is intact.
 * DELETE THIS before production.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  }

  const supabase = createClient(url, key);

  // 1. Check profiles table is readable
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, system_role')
    .limit(3);

  // 2. Check constraint values
  const { data: roles } = await supabase
    .from('profiles')
    .select('system_role')
    .limit(100);

  const uniqueRoles = [...new Set((roles ?? []).map(r => r.system_role))];

  // 3. Check RLS with anon key (simulates what the app does)
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const anonClient = createClient(url, anonKey);
  const { data: anonProfiles, error: anonErr } = await anonClient
    .from('profiles')
    .select('id')
    .limit(1);

  return NextResponse.json({
    ok: !profilesErr,
    profilesErr: profilesErr?.message ?? null,
    sampleProfiles: profiles,
    uniqueRoles,
    anonTest: {
      ok: !anonErr,
      error: anonErr?.message ?? null,
      rowCount: anonProfiles?.length ?? 0,
    },
  });
}
