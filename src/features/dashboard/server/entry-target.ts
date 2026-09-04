import 'server-only';

import type { UserDomain } from '@/lib/types';
import { auth } from '@/services/auth';
import type { User } from '@/services/client';
import { fetchCurrentUser } from '@/services/user/current-user';
import {
  buildDashboardSwitchPath,
  normalizeStoredUserDomain,
} from '@/src/features/dashboard/lib/active-domain-storage';
import {
  dashboardUrl,
  domainToRouteSegment,
  type RoleSegment,
} from '@/src/features/dashboard/lib/dashboard-url';

type DashboardEntryResolution = {
  redirectTo: string;
  activeDomain: UserDomain | null;
};

type DashboardGuardResolution = {
  redirectTo: string | null;
  activeDomain: UserDomain | null;
};

async function getServerDashboardUser() {
  // The session check stays: with no session there is no bearer token to send, and a
  // tokenless /me is a guaranteed 401 round trip. Identity itself now comes from the
  // token rather than from the session email — `fetchCurrentUser` runs through the
  // generated client, whose config attaches the access token on server-side calls.
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  try {
    return await fetchCurrentUser();
  } catch {
    return null;
  }
}

function extractUserDomains(user: User | null) {
  const rawDomains = Array.isArray(user?.user_domain)
    ? user.user_domain
    : user?.user_domain
      ? [user.user_domain]
      : [];

  return Array.from(
    new Set(
      rawDomains
        .map(normalizeStoredUserDomain)
        .filter((domain): domain is UserDomain => Boolean(domain))
    )
  );
}

export async function resolveDashboardEntryTarget(
  preferredDomain: UserDomain | null,
  nextPath = '/dashboard/overview'
): Promise<DashboardEntryResolution> {
  const user = await getServerDashboardUser();

  if (!user) {
    return {
      redirectTo: '/',
      activeDomain: null,
    };
  }

  const domains = extractUserDomains(user);
  if (!domains.length) {
    return {
      redirectTo: '/onboarding',
      activeDomain: null,
    };
  }

  const activeDomain =
    (preferredDomain && domains.includes(preferredDomain) ? preferredDomain : domains[0]) ?? null;

  if (
    activeDomain &&
    (activeDomain === 'organisation' || activeDomain === 'organisation_user') &&
    (!user.organisation_affiliations || user.organisation_affiliations.length === 0)
  ) {
    return {
      redirectTo: '/onboarding/organisation',
      activeDomain,
    };
  }

  if (!activeDomain) {
    return {
      redirectTo: '/dashboard',
      activeDomain: null,
    };
  }

  return {
    redirectTo: buildDashboardSwitchPath(activeDomain, nextPath),
    activeDomain,
  };
}

export async function resolveDashboardGuard(
  preferredDomain: UserDomain | null
): Promise<DashboardGuardResolution> {
  const user = await getServerDashboardUser();

  if (!user) {
    return {
      redirectTo: '/',
      activeDomain: null,
    };
  }

  const domains = extractUserDomains(user);
  if (!domains.length) {
    return {
      redirectTo: '/onboarding',
      activeDomain: null,
    };
  }

  const activeDomain =
    (preferredDomain && domains.includes(preferredDomain) ? preferredDomain : domains[0]) ?? null;

  if (
    activeDomain &&
    (activeDomain === 'organisation' || activeDomain === 'organisation_user') &&
    (!user.organisation_affiliations || user.organisation_affiliations.length === 0)
  ) {
    return {
      redirectTo: '/onboarding/organisation',
      activeDomain,
    };
  }

  return {
    redirectTo: null,
    activeDomain,
  };
}

type RoleAccessResolution = {
  /** A path to redirect to, or null when the viewer may see this role segment. */
  redirectTo: string | null;
  /** The viewer's own domain that satisfies this segment, when access is granted. */
  matchedDomain: UserDomain | null;
};

/**
 * Guard used by each role segment's layout (`/dashboard/<segment>/...`). Replaces
 * the old cookie-driven slot selection: access is now decided by the URL segment +
 * the viewer's real `user_domain[]`, not by a stored active-dashboard cookie.
 *
 * A viewer may see a segment iff one of their domains maps to it (so the
 * `organisation` segment is satisfied by either `organisation` or
 * `organisation_user`). Otherwise they are redirected to their own default
 * dashboard rather than shown a 404.
 */
export async function assertRoleAccess(segment: RoleSegment): Promise<RoleAccessResolution> {
  const user = await getServerDashboardUser();

  if (!user) {
    return { redirectTo: '/', matchedDomain: null };
  }

  const domains = extractUserDomains(user);
  if (!domains.length) {
    return { redirectTo: '/onboarding', matchedDomain: null };
  }

  const matchedDomain = domains.find(domain => domainToRouteSegment(domain) === segment) ?? null;

  if (!matchedDomain) {
    // Viewer lacks this role — send them to their own default dashboard.
    const [primaryDomain] = domains;
    return {
      redirectTo: primaryDomain ? dashboardUrl(primaryDomain, 'overview') : '/dashboard',
      matchedDomain: null,
    };
  }

  if (
    segment === 'organisation' &&
    (!user.organisation_affiliations || user.organisation_affiliations.length === 0)
  ) {
    return { redirectTo: '/onboarding/organisation', matchedDomain };
  }

  return { redirectTo: null, matchedDomain };
}
