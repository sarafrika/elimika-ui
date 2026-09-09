import 'server-only';

import { cache } from 'react';
import type { UserDomain } from '@/lib/types';
import { auth } from '@/services/auth';
import type { User } from '@/services/client';
import { fetchCurrentUser } from '@/services/user/current-user';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';
import {
  dashboardUrl,
  domainToRouteSegment,
  type RoleSegment,
} from '@/src/features/dashboard/lib/dashboard-url';

/**
 * Who is asking, and can we tell?
 *
 * `unavailable` is the whole point: a timed-out `/me` used to return null, which
 * every caller read as "signed out" and answered with a redirect to `/`. A slow
 * API therefore logged people out at random.
 */
type Identity =
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: User }
  | { status: 'unavailable' };

type DashboardEntryResolution = {
  redirectTo: string;
  activeDomain: UserDomain | null;
};

type DashboardGuardResolution = {
  redirectTo: string | null;
  activeDomain: UserDomain | null;
  /** True when identity could not be read; render a retry rather than bouncing. */
  unavailable?: boolean;
};

/**
 * One identity lookup per request, shared by every layout and page in it.
 *
 * A dashboard render asks this question from the root layout, the role layout and
 * often the page as well. Without `cache` each asked the API separately — the
 * dashboard entry alone cost four `/me` round trips. React dedupes for the
 * lifetime of one render pass, so they now share a single call.
 */
const resolveIdentity = cache(async (): Promise<Identity> => {
  // `auth()` decrypts the session cookie and throws on a malformed one. That throw
  // used to escape into the dashboard layout, above the error boundary, and 500 the
  // whole navigation; a cookie we cannot read means anonymous, not broken.
  let signedIn = false;
  try {
    const session = await auth();
    signedIn = Boolean(session?.user?.email);
  } catch {
    return { status: 'anonymous' };
  }

  if (!signedIn) {
    return { status: 'anonymous' };
  }

  try {
    const user = await fetchCurrentUser();
    return user ? { status: 'authenticated', user } : { status: 'unavailable' };
  } catch {
    return { status: 'unavailable' };
  }
});

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

/** The domain to act as, given what the viewer holds and what they last chose. */
function pickActiveDomain(domains: UserDomain[], preferred: UserDomain | null) {
  if (preferred && domains.includes(preferred)) return preferred;
  return domains[0] ?? null;
}

function needsOrganisationOnboarding(user: User, domain: UserDomain | null) {
  return (
    (domain === 'organisation' || domain === 'organisation_user') &&
    (!user.organisation_affiliations || user.organisation_affiliations.length === 0)
  );
}

/**
 * Where `/dashboard` sends the caller.
 *
 * It answers with the role overview directly. It used to answer with
 * `/dashboard/switch/<domain>`, which set the active-dashboard cookie and
 * redirected again — three requests to open one page, and the whole layout stack
 * re-resolved identity on each. The entry now sets that cookie on its own
 * response, so the switch route is only for a deliberate role change.
 */
export async function resolveDashboardEntryTarget(
  preferredDomain: UserDomain | null,
  nextPath = 'overview'
): Promise<DashboardEntryResolution> {
  const identity = await resolveIdentity();

  if (identity.status === 'anonymous') {
    return { redirectTo: '/', activeDomain: null };
  }

  // Nothing to route on and no reason to believe they are signed out. Onboarding is
  // the one destination that is safe to show either way, and it never loops back here.
  if (identity.status === 'unavailable') {
    return { redirectTo: '/onboarding', activeDomain: null };
  }

  const { user } = identity;
  const domains = extractUserDomains(user);
  if (!domains.length) {
    return { redirectTo: '/onboarding', activeDomain: null };
  }

  const activeDomain = pickActiveDomain(domains, preferredDomain);

  if (!activeDomain) {
    return { redirectTo: '/onboarding', activeDomain: null };
  }

  if (needsOrganisationOnboarding(user, activeDomain)) {
    return { redirectTo: '/onboarding/organisation', activeDomain };
  }

  return {
    redirectTo: dashboardUrl(activeDomain, nextPath),
    activeDomain,
  };
}

export async function resolveDashboardGuard(
  preferredDomain: UserDomain | null
): Promise<DashboardGuardResolution> {
  const identity = await resolveIdentity();

  if (identity.status === 'anonymous') {
    return { redirectTo: '/', activeDomain: null };
  }

  // Hold the page rather than redirect: bouncing a signed-in viewer to `/` because
  // one call timed out is the spurious logout this whole type exists to prevent.
  if (identity.status === 'unavailable') {
    return { redirectTo: null, activeDomain: preferredDomain, unavailable: true };
  }

  const { user } = identity;
  const domains = extractUserDomains(user);
  if (!domains.length) {
    return { redirectTo: '/onboarding', activeDomain: null };
  }

  const activeDomain = pickActiveDomain(domains, preferredDomain);

  if (needsOrganisationOnboarding(user, activeDomain)) {
    return { redirectTo: '/onboarding/organisation', activeDomain };
  }

  return { redirectTo: null, activeDomain };
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
  const identity = await resolveIdentity();

  if (identity.status === 'anonymous') {
    return { redirectTo: '/', matchedDomain: null };
  }

  // The root dashboard layout already decided to hold this render; do not
  // second-guess it with a redirect built on the same missing answer.
  if (identity.status === 'unavailable') {
    return { redirectTo: null, matchedDomain: null };
  }

  const { user } = identity;
  const domains = extractUserDomains(user);
  if (!domains.length) {
    return { redirectTo: '/onboarding', matchedDomain: null };
  }

  const matchedDomain = domains.find(domain => domainToRouteSegment(domain) === segment) ?? null;

  if (!matchedDomain) {
    // Viewer lacks this role — send them to their own default dashboard. Never to
    // `/dashboard`: that resolves back into this stack and loops.
    const [primaryDomain] = domains;
    return {
      redirectTo: primaryDomain ? dashboardUrl(primaryDomain, 'overview') : '/onboarding',
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
