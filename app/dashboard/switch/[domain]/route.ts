import { NextRequest, NextResponse } from 'next/server';
import {
  ACTIVE_DASHBOARD_COOKIE,
  ACTIVE_DASHBOARD_COOKIE_MAX_AGE,
  normalizeStoredUserDomain,
} from '@/src/features/dashboard/lib/active-domain-storage';

function buildPublicRequestUrl(request: NextRequest, path: string) {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host') || request.nextUrl.host;
  const isLocalHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(host);
  const protocol = forwardedProto === 'https' || !isLocalHost ? 'https' : 'http';

  return new URL(path, `${protocol}://${host}`);
}

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

  const response = NextResponse.redirect(buildPublicRequestUrl(request, nextPath));

  if (normalizedDomain) {
    response.cookies.set(ACTIVE_DASHBOARD_COOKIE, normalizedDomain, {
      path: '/',
      maxAge: ACTIVE_DASHBOARD_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
  }

  return response;
}
