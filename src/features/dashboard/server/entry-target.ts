import 'server-only';

import type { UserDomain } from '@/lib/types';
import { auth } from '@/services/auth';
import { type SearchResponse, search, type User } from '@/services/client';
import {
  buildDashboardSwitchPath,
  normalizeStoredUserDomain,
} from '@/src/features/dashboard/lib/active-domain-storage';

type DashboardEntryResolution = {
  redirectTo: string;
  activeDomain: UserDomain | null;
};

async function getServerDashboardUser() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const { data } = await search({
    query: {
      searchParams: {
        email_eq: session.user.email,
      },
      pageable: {
        page: 0,
        size: 1,
        sort: [],
      },
    },
  });

  const payload = data as SearchResponse;
  const user = Array.isArray(payload.data?.content)
    ? (payload.data.content[0] as User | undefined)
    : undefined;

  return user ?? null;
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
      redirectTo: '/dashboard/overview',
      activeDomain: null,
    };
  }

  return {
    redirectTo: buildDashboardSwitchPath(activeDomain, nextPath),
    activeDomain,
  };
}
