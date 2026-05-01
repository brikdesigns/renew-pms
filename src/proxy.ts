import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  // Pass the full `request` (not just headers) so request.cookies updates
  // from setAll propagate to downstream Server Components — required by the
  // canonical Supabase SSR pattern. Forwarding only headers leaves layouts
  // (e.g. (auth)/layout.tsx -> getAuthUser) reading the pre-refresh cookies,
  // which presents as random "logged out on refresh / view switch."
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — this keeps the auth cookie alive
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/login';
  const isApiDebug = pathname.startsWith('/api/debug');
  const isVendorRoute = pathname.startsWith('/vendor/') || pathname.startsWith('/api/vendor/');
  // Cron endpoints authenticate via shared-secret Bearer token (CRON_SECRET),
  // not user session — exempt them from the session-based redirect so the
  // scheduled function and curl smoke tests aren't bounced to /login.
  const isCronRoute = pathname.startsWith('/api/cron/');
  const isAuthFlow =
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/api/auth/forgot-password' ||
    pathname === '/api/auth/callback';
  const isPublicRoute =
    pathname === '/login' || pathname === '/' || isApiDebug || isVendorRoute || isCronRoute || isAuthFlow;

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login. Carry the freshly-refreshed
  // cookies from `response` onto the redirect — otherwise a token refresh
  // that lands on /login is dropped and the next request re-refreshes.
  if (user && isLoginPage) {
    const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  // Skip middleware for fumadocs routes (/docs, /guide) — purely informational,
  // no auth state needed. Cuts proxy.ts work for every doc page navigation.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|docs(?:/|$)|guide(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
