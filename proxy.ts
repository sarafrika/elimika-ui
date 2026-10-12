import { auth } from '@/services/auth';
import type { UserDomain } from '@/lib/types';
import { domainToRouteSegment } from '@/src/features/dashboard/lib/dashboard-url';
import { NextResponse } from 'next/server';
import { redirectToPath } from '@/lib/site-redirect';
import { SESSION_EXPIRED_HEADER } from '@/services/auth/session-expired';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function workspaceDomainToSegment(domain: string): string | null {
  const normalized = (domain === 'organization' ? 'organisation' : domain) as UserDomain;
  return domainToRouteSegment(normalized) ?? null;
}

export default auth(req => {
  const { pathname } = req.nextUrl;
  const isAuth = !!req.auth;
  const refreshFailed = req.auth?.error === 'RefreshAccessTokenError';

  // API calls run through here only so an access-token refresh lands in the cookie.
  if (pathname.startsWith('/api/')) {
    if (refreshFailed) {
      return NextResponse.json(
        { success: false, message: 'Session expired' },
        { status: 401, headers: { [SESSION_EXPIRED_HEADER]: '1' } }
      );
    }
    return NextResponse.next();
  }

  // The old, un-shareable org-only course URL now resolves to the public,
  // role-independent course page so shared links work for anyone. Checked before the
  // sign-in guard: a logged-out visitor with a shared link belongs on the public page,
  // not on the home page.
  const courseMatch = pathname.match(/^\/dashboard\/courses\/([^/]+)\/?$/);
  if (courseMatch?.[1] && UUID_RE.test(courseMatch[1])) {
    return redirectToPath(req, `/courses/${courseMatch[1]}`);
  }

  // Define protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/onboarding'];

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If accessing protected route without authentication, redirect to home
  // A failed refresh sends the user to sign in once; the next request drops the session.
  if ((!isAuth || refreshFailed) && isProtectedRoute) {
    return redirectToPath(req, '/');
  }

  const search = req.nextUrl.search;

  // Legacy interim role-in-URL shim: /dashboard/workspace/<domain>/<rest>
  //  -> canonical /dashboard/<segment>/<rest>
  if (pathname.startsWith('/dashboard/workspace/')) {
    const parts = pathname.split('/').filter(Boolean); // ['dashboard','workspace','<domain>',...rest]
    const domain = parts[2];
    const segment = domain ? workspaceDomainToSegment(domain) : null;
    if (segment) {
      const rest = parts.slice(3).join('/');
      const target = `/dashboard/${segment}${rest ? `/${rest}` : '/overview'}${search}`;
      return redirectToPath(req, target);
    }
  }

  // Allow the request to continue
  return NextResponse.next();
});

// Must stay on the Node runtime: the refresh dedupe map in services/auth is per process.
export const config = {
  matcher: [
    /*
     * Pages plus the API proxy (minus public api/v1/files reads) and media
     * routes so token refreshes persist; API, _next and /public assets skipped.
     */
    '/',
    '/api/proxy/((?!api/v1/files/).*)',
    '/api/media',
    '/((?!api|_next/static|_next/image|favicon.ico|logos/|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)',
  ],
};
