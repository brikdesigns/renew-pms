import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, system_role, email, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.system_role !== 'brik_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(
    {
      step: 'profile',
      userId: user.id,
      userEmail: user.email,
      profile,
      profileError,
    },
    {
      // Auth-tier debug payload — never cache at CDN/proxy. Without this
      // header, an intermediary could serve one brik_admin's profile to
      // another. Pair with any future PHI-emitting route.
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    },
  );
}
