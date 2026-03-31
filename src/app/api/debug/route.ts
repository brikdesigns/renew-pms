import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ step: 'auth', user: null, error: userError });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, system_role, email, first_name, last_name')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    step: 'profile',
    userId: user.id,
    userEmail: user.email,
    profile,
    profileError,
  });
}
