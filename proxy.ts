import { auth } from '@/services/auth';
import type { UserDomain } from '@/lib/types';
import { domainToRouteSegment } from '@/src/features/dashboard/lib/dashboard-url';
import { NextResponse } from 'next/server';
import { redirectToPath } from '@/lib/site-redirect';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function workspaceDomainToSegment(domain: string): string | null {
  const normalized = (domain === 'organization' ? 'organisation' : domain) as UserDomain;
  return domainToRouteSegment(normalized) ?? null;
}

export default auth(req => {
  const { pathname } = req.nextUrl;
  const isAuth = !!req.auth;

  // Define protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/onboarding'];

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If accessing protected route without authentication, redirect to home
  if (!isAuth && isProtectedRoute) {
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

  // The old, un-shareable org-only course URL now resolves to the public,
  // role-independent course page so shared links work for anyone.
  const courseMatch = pathname.match(/^\/dashboard\/courses\/([^/]+)\/?$/);
  if (courseMatch && courseMatch[1] && UUID_RE.test(courseMatch[1])) {
    return redirectToPath(req, `/courses/${courseMatch[1]}`);
  }

  // Allow the request to continue
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - API routes
     * - Next.js internal files
     */
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
