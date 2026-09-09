import { NextResponse, type NextRequest } from 'next/server';
import {
  ACTIVE_DASHBOARD_COOKIE,
  ACTIVE_DASHBOARD_COOKIE_MAX_AGE,
  normalizeStoredUserDomain,
} from '@/src/features/dashboard/lib/active-domain-storage';
import { resolveDashboardEntryTarget } from '@/src/features/dashboard/server/entry-target';

/**
 * The role-agnostic dashboard entry.
 *
 * A handler rather than a page for two reasons: it can set the active-dashboard
 * cookie on its own response, which a server component cannot, and it skips the
 * dashboard layout — so opening the dashboard resolves identity once instead of
 * four times across three redirects.
 */
export async function GET(request: NextRequest) {
  const preferred = normalizeStoredUserDomain(
    request.cookies.get(ACTIVE_DASHBOARD_COOKIE)?.value
  );
  const target = await resolveDashboardEntryTarget(preferred);

  const response = NextResponse.redirect(new URL(target.redirectTo, request.nextUrl.origin));

  if (target.activeDomain && target.activeDomain !== preferred) {
    response.cookies.set(ACTIVE_DASHBOARD_COOKIE, target.activeDomain, {
      path: '/',
      maxAge: ACTIVE_DASHBOARD_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
  }

  return response;
}
