import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Code-bearing URL must never be cached — a cached redirect could replay an
// already-consumed OAuth code and surface as `invalid_grant`. See #195.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirect}`);
    }
    // Surface the real reason on the client so we can collapse hypotheses
    // (`invalid_grant` = code already consumed; `pkce_*` = verifier cookie
    // didn't survive; otherwise = config/network). See #195.
    console.error('[auth/callback] exchangeCodeForSession failed:', error.message, error.status);
    const reasonParam = encodeURIComponent(error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed&reason=${reasonParam}`);
  }

  // No code param → legacy implicit-flow callback. Tokens (or errors) are in
  // the URL hash, which the server cannot read. Forward to the redirect
  // destination unchanged; the browser preserves the hash across redirects,
  // and @supabase/ssr's createBrowserClient on the destination page auto-
  // detects the session via detectSessionInUrl (default true).
  return NextResponse.redirect(`${origin}${redirect}`);
}
