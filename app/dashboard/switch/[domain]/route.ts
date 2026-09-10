import { NextRequest } from 'next/server';
import { redirectToPath } from '@/lib/site-redirect';
import {
  ACTIVE_DASHBOARD_COOKIE,
  ACTIVE_DASHBOARD_COOKIE_MAX_AGE,
  normalizeStoredUserDomain,
  resolveWorkspaceSwitchPath,
} from '@/src/features/dashboard/lib/active-domain-storage';

type RouteContext = {
  params: Promise<{ domain: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { domain } = await context.params;
  const normalizedDomain = normalizeStoredUserDomain(domain);
  const requestedNextPath = request.nextUrl.searchParams.get('next');
  const nextPath =
    normalizedDomain &&
    requestedNextPath &&
    requestedNextPath.startsWith('/') &&
    !requestedNextPath.startsWith('//') &&
    !requestedNextPath.startsWith('/dashboard')
      ? requestedNextPath
      : resolveWorkspaceSwitchPath(normalizedDomain, requestedNextPath);

  const response = redirectToPath(request, nextPath);

  if (normalizedDomain) {
    response.cookies.set(ACTIVE_DASHBOARD_COOKIE, normalizedDomain, {
      path: '/',
      maxAge: ACTIVE_DASHBOARD_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
  }

  return response;
}
