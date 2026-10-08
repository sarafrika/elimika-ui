import 'server-only';

import type { Session } from 'next-auth';
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

/** The slice of the user record the guards route on. */
type IdentityUser = {
  domains: UserDomain[];
  hasOrganisationAffiliation: boolean;
};

/**
 * Who is asking, and can we tell?
 *
 * `unavailable` is the whole point: a timed-out `/me` used to return null, which
 * every caller read as "signed out" and answered with a redirect to `/`. A slow
 * API therefore logged people out at random.
 */
type Identity =
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: IdentityUser; fromToken: boolean }
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

function toIdentityUser(user: User): IdentityUser {
  const rawDomains = Array.isArray(user.user_domain)
    ? user.user_domain
    : user.user_domain
      ? [user.user_domain]
      : [];
  return {
    domains: normalizeDomains(rawDomains),
    hasOrganisationAffiliation: (user.organisation_affiliations?.length ?? 0) > 0,
  };
}

function normalizeDomains(rawDomains: readonly unknown[]) {
  return Array.from(
    new Set(
      rawDomains
        .map(domain => (typeof domain === 'string' ? normalizeStoredUserDomain(domain) : null))
        .filter((domain): domain is UserDomain => Boolean(domain))
    )
  );
}

/** Ask the API directly. Shared per request by `cache`, like the token read. */
const fetchIdentity = cache(async (): Promise<Identity> => {
  try {
    const user = await fetchCurrentUser();
    return user
      ? { status: 'authenticated', user: toIdentityUser(user), fromToken: false }
      : { status: 'unavailable' };
  } catch {
    return { status: 'unavailable' };
  }
});

// One lookup per request, read from the session token's stamped identity (no network).
// Only a token issued before that stamp existed falls back to `/me`.
const resolveIdentity = cache(async (): Promise<Identity> => {
  // `auth()` throws on a malformed cookie; one we cannot read means anonymous, not broken.
  let session: Session | null = null;
  try {
    session = await auth();
  } catch {
    return { status: 'anonymous' };
  }

  if (!session?.user?.email) {
    return { status: 'anonymous' };
  }

  if (session.identity) {
    return {
      status: 'authenticated',
      fromToken: true,
      user: {
        domains: normalizeDomains(session.identity.domains),
        hasOrganisationAffiliation: session.identity.hasOrganisationAffiliation,
      },
    };
  }

  return fetchIdentity();
});

// Trust the token, but confirm a bounce against `/me`: the token can lag a fresh
// onboarding, and a stale "no such role" must not redirect someone who now holds it.
async function decide<T>(
  evaluate: (identity: Identity) => T,
  isBounce: (result: T) => boolean
): Promise<T> {
  const identity = await resolveIdentity();
  const result = evaluate(identity);
  if (identity.status !== 'authenticated' || !identity.fromToken || !isBounce(result)) {
    return result;
  }
  const fresh = await fetchIdentity();
  return fresh.status === 'authenticated' ? evaluate(fresh) : result;
}

/** The domain to act as, given what the viewer holds and what they last chose. */
function pickActiveDomain(domains: UserDomain[], preferred: UserDomain | null) {
  if (preferred && domains.includes(preferred)) return preferred;
  return domains[0] ?? null;
}

function needsOrganisationOnboarding(user: IdentityUser, domain: UserDomain | null) {
  return (
    (domain === 'organisation' || domain === 'organisation_user') &&
    !user.hasOrganisationAffiliation
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
  return decide(
    identity => evaluateEntryTarget(identity, preferredDomain, nextPath),
    result => result.redirectTo.startsWith('/onboarding')
  );
}

function evaluateEntryTarget(
  identity: Identity,
  preferredDomain: UserDomain | null,
  nextPath: string
): DashboardEntryResolution {
  if (identity.status === 'anonymous') {
    return { redirectTo: '/', activeDomain: null };
  }

  // Nothing to route on and no reason to believe they are signed out. Onboarding is
  // the one destination that is safe to show either way, and it never loops back here.
  if (identity.status === 'unavailable') {
    return { redirectTo: '/onboarding', activeDomain: null };
  }

  const { user } = identity;
  const { domains } = user;
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
  return decide(
    identity => evaluateGuard(identity, preferredDomain),
    result => result.redirectTo !== null
  );
}

function evaluateGuard(
  identity: Identity,
  preferredDomain: UserDomain | null
): DashboardGuardResolution {
  if (identity.status === 'anonymous') {
    return { redirectTo: '/', activeDomain: null };
  }

  // Hold the page rather than redirect: bouncing a signed-in viewer to `/` because
  // one call timed out is the spurious logout this whole type exists to prevent.
  if (identity.status === 'unavailable') {
    return { redirectTo: null, activeDomain: preferredDomain, unavailable: true };
  }

  const { user } = identity;
  const { domains } = user;
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
  return decide(
    identity => evaluateRoleAccess(identity, segment),
    result => result.redirectTo !== null
  );
}

function evaluateRoleAccess(identity: Identity, segment: RoleSegment): RoleAccessResolution {
  if (identity.status === 'anonymous') {
    return { redirectTo: '/', matchedDomain: null };
  }

  // The root dashboard layout already decided to hold this render; do not
  // second-guess it with a redirect built on the same missing answer.
  if (identity.status === 'unavailable') {
    return { redirectTo: null, matchedDomain: null };
  }

  const { user } = identity;
  const { domains } = user;
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

  if (segment === 'organisation' && !user.hasOrganisationAffiliation) {
    return { redirectTo: '/onboarding/organisation', matchedDomain };
  }

  return { redirectTo: null, matchedDomain };
}
