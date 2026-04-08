'use client';

import { useSession } from 'next-auth/react';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { UserDomain } from '@/lib/types';
import { getDashboardStorageKey } from '@/lib/utils';
import {
  clearPersistedDashboardDomain,
  normalizeStoredUserDomain,
  persistDashboardDomain,
  readPersistedDashboardDomain,
} from '@/src/features/dashboard/lib/active-domain-storage';
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

    const nextDomain =
      storedDomain && domains.includes(storedDomain) ? storedDomain : (domains[0] ?? null);

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
      return domains[0] ?? null;
    });
  }, [domains, hydrated]);

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
    setActiveDomainState(domain);
  };

  const clearDomain = () => {
    setActiveDomainState(null);
    clearPersistedDashboardDomain(dashboardStorageKey);
  };

  const value = useMemo(
    () => ({
      domains,
      activeDomain,
      hasMultipleDomains: domains.length > 1,
      isLoading: Boolean(profile?.isLoading) || !hydrated,
      isReady: hydrated && !profile?.isLoading,
      setActiveDomain,
      clearDomain,
    }),
    [domains, activeDomain, profile?.isLoading, hydrated]
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
