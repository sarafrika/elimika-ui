'use client';

import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { UserDomain } from '@/lib/types';
import { getDashboardStorageKey } from '@/lib/utils';
import {
  clearPersistedDashboardDomain,
  normalizeStoredUserDomain,
  persistDashboardDomain,
  readPersistedDashboardDomain,
} from '@/src/features/dashboard/lib/active-domain-storage';
import {
  domainToRouteSegment,
  routeSegmentFromPath,
} from '@/src/features/dashboard/lib/dashboard-url';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

type UserDomainContextValue = {
  domains: UserDomain[];
  activeDomain: UserDomain | null;
  hasMultipleDomains: boolean;
  isLoading: boolean;
  isReady: boolean;
  setActiveDomain: (domain: UserDomain) => void;
  clearDomain: () => void;
};

const UserDomainContext = createContext<UserDomainContextValue | null>(null);

export function UserDomainProvider({ children }: { children: ReactNode }) {
  const profile = useUserProfile();
  const { status } = useSession();
  const pathname = usePathname();
  const rawDomains = profile?.user_domain;

  const domains = useMemo(() => {
    const asArray = Array.isArray(rawDomains) ? rawDomains : rawDomains ? [rawDomains] : [];
    const normalized = asArray
      .map(normalizeStoredUserDomain)
      .filter((domain): domain is UserDomain => Boolean(domain));
    return Array.from(new Set(normalized));
  }, [rawDomains]);

  const [activeDomain, setActiveDomainState] = useState<UserDomain | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Active role now comes from the URL segment (/dashboard/<segment>/...). Match it
  // against the user's own domains so organisation / organisation_user both resolve.
  const pathnameDomain = useMemo(() => {
    const segment = routeSegmentFromPath(pathname);
    if (!segment) return null;
    return domains.find(domain => domainToRouteSegment(domain) === segment) ?? null;
  }, [pathname, domains]);

  const dashboardStorageKey = useMemo(
    () => getDashboardStorageKey(profile?.uuid ?? profile?.email ?? undefined),
    [profile?.uuid, profile?.email]
  );

  useEffect(() => {
    if (profile?.isLoading || hydrated) return;

    if (!domains.length) {
      setActiveDomainState(null);
      setHydrated(true);
      return;
    }

    const storedDomain = readPersistedDashboardDomain(dashboardStorageKey);

    // With no saved choice, multi-profile users must pick a dashboard (activeDomain stays null).
    const nextDomain =
      storedDomain && domains.includes(storedDomain)
        ? storedDomain
        : domains.length === 1
          ? domains[0]
          : null;

    setActiveDomainState(nextDomain);
    setHydrated(true);
  }, [profile?.isLoading, hydrated, domains, dashboardStorageKey]);

  useEffect(() => {
    if (!hydrated) return;

    if (!domains.length) {
      setActiveDomainState(null);
      return;
    }

    setActiveDomainState(prev => {
      if (prev && domains.includes(prev)) return prev;
      return domains.length === 1 ? domains[0] : null;
    });
  }, [domains, hydrated]);

  useEffect(() => {
    if (!pathnameDomain || !domains.includes(pathnameDomain)) {
      return;
    }

    setActiveDomainState(prev => (prev === pathnameDomain ? prev : pathnameDomain));
  }, [domains, pathnameDomain]);

  /*
   * Drop every cached response when the user changes dashboards.
   *
   * The API now answers the same request differently depending on the dashboard
   * it came from — an admin who is also a learner reads a course they have not
   * enrolled in as an admin on one page and as a prospect on the other. The query
   * cache is keyed on the endpoint alone and is persisted to sessionStorage, so
   * without this the previous dashboard's (more privileged) answer would be
   * replayed on the new one until it went stale, and the server-side cap would
   * appear not to have worked.
   *
   * Only on a real switch: the first resolution from null is a page load, which
   * has nothing to carry over.
   */
  const queryClient = useQueryClient();
  const previousDomain = useRef<UserDomain | null>(null);
  useEffect(() => {
    const previous = previousDomain.current;
    previousDomain.current = activeDomain;

    if (previous && activeDomain && previous !== activeDomain) {
      queryClient.clear();
    }
  }, [activeDomain, queryClient]);

  useEffect(() => {
    if (typeof window === 'undefined' || !hydrated) return;

    if (activeDomain) {
      persistDashboardDomain(dashboardStorageKey, activeDomain);
    } else {
      clearPersistedDashboardDomain(dashboardStorageKey);
    }
  }, [activeDomain, dashboardStorageKey, hydrated]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setActiveDomainState(null);
      setHydrated(false);
      clearPersistedDashboardDomain(dashboardStorageKey);
    }
  }, [status, dashboardStorageKey]);

  const setActiveDomain = (domain: UserDomain) => {
    if (!domains.includes(domain)) return;
    persistDashboardDomain(dashboardStorageKey, domain);
    setActiveDomainState(domain);
  };

  const clearDomain = () => {
    setActiveDomainState(null);
    clearPersistedDashboardDomain(dashboardStorageKey);
  };

  const value = useMemo(
    () => ({
      domains,
      activeDomain:
        pathnameDomain && domains.includes(pathnameDomain) ? pathnameDomain : activeDomain,
      hasMultipleDomains: domains.length > 1,
      isLoading: Boolean(profile?.isLoading) || !hydrated,
      isReady: hydrated && !profile?.isLoading,
      setActiveDomain,
      clearDomain,
    }),
    [domains, pathnameDomain, activeDomain, profile?.isLoading, hydrated]
  );

  return <UserDomainContext.Provider value={value}>{children}</UserDomainContext.Provider>;
}

export function useUserDomain() {
  const ctx = useContext(UserDomainContext);
  if (!ctx) {
    throw new Error('useUserDomain must be used within a UserDomainProvider');
  }

  return ctx;
}
