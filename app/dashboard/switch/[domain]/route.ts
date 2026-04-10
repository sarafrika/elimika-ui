import { NextRequest, NextResponse } from 'next/server';
import {
  ACTIVE_DASHBOARD_COOKIE,
  ACTIVE_DASHBOARD_COOKIE_MAX_AGE,
  normalizeStoredUserDomain,
} from '@/src/features/dashboard/lib/active-domain-storage';

type RouteContext = {
  params: Promise<{ domain: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { domain } = await context.params;
  const normalizedDomain = normalizeStoredUserDomain(domain);
  const requestedNextPath = request.nextUrl.searchParams.get('next');
  const nextPath = requestedNextPath?.startsWith('/dashboard/')
    ? requestedNextPath
    : '/dashboard/overview';

  // Use a relative Location header so reverse proxies don't leak the internal app origin.
  const response = NextResponse.redirect(nextPath);

  if (normalizedDomain) {
    response.cookies.set(ACTIVE_DASHBOARD_COOKIE, normalizedDomain, {
      path: '/',
      maxAge: ACTIVE_DASHBOARD_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
  }

  return response;
}
