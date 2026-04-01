'use client';

import type { UserDomain } from '@/lib/types';
import { getDashboardStorageKey } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useUserProfile } from './profile-context';

type UserDomainContextValue = {
  domains: UserDomain[];
  activeDomain: UserDomain | null;
  hasMultipleDomains: boolean;
  isLoading: boolean;
  isReady: boolean;
  setActiveDomain: (domain: UserDomain) => void;
  clearDomain: () => void;
};

const ALLOWED_DOMAINS: UserDomain[] = [
  'student',
  'instructor',
  'admin',
  'parent',
  'course_creator',
  'organisation_user',
  'organisation',
] as const;

const UserDomainContext = createContext<UserDomainContextValue | null>(null);

const normalizeDomain = (domain: unknown): UserDomain | null => {
  if (typeof domain !== 'string') return null;
  const normalized = domain === 'organization' ? 'organisation' : domain;
  return ALLOWED_DOMAINS.includes(normalized as UserDomain) ? (normalized as UserDomain) : null;
};

const getStoredDomain = (storageKeys: string[], legacyStorageKey: string) => {
  if (typeof window === 'undefined') return null;

  return [...storageKeys, legacyStorageKey]
    .map(storageKey => normalizeDomain(localStorage.getItem(storageKey)))
    .find((domain): domain is UserDomain => Boolean(domain)) ?? null;
};

export function UserDomainProvider({ children }: { children: ReactNode }) {
  const profile = useUserProfile();
  const { data: session, status } = useSession();
  const rawDomains = profile?.user_domain;

  const domains = useMemo(() => {
    const asArray = Array.isArray(rawDomains) ? rawDomains : rawDomains ? [rawDomains] : [];
    const normalized = asArray
      .map(normalizeDomain)
      .filter((domain): domain is UserDomain => Boolean(domain));
    return Array.from(new Set(normalized));
  }, [rawDomains]);

  const [activeDomain, setActiveDomainState] = useState<UserDomain | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const dashboardStorageKeys = useMemo(
    () =>
      Array.from(
        new Set(
          [profile?.uuid, profile?.email, session?.user?.email]
            .filter((identifier): identifier is string => Boolean(identifier))
            .map(identifier => getDashboardStorageKey(identifier))
        )
      ),
    [profile?.uuid, profile?.email, session?.user?.email]
  );
  const legacyDashboardStorageKey = useMemo(() => getDashboardStorageKey(), []);

  useEffect(() => {
    if (profile?.isLoading) return;

    if (!domains.length) {
      setActiveDomainState(null);
      setHydrated(true);
      return;
    }

    const storedDomain = getStoredDomain(dashboardStorageKeys, legacyDashboardStorageKey);

    setActiveDomainState(previousDomain => {
      if (storedDomain && domains.includes(storedDomain)) {
        return storedDomain;
      }

      if (previousDomain && domains.includes(previousDomain)) {
        return previousDomain;
      }

      return domains[0] ?? null;
    });
    setHydrated(true);
  }, [profile?.isLoading, domains, dashboardStorageKeys, legacyDashboardStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || !hydrated) return;

    const storageKeysToSync = dashboardStorageKeys.length
      ? dashboardStorageKeys
      : [legacyDashboardStorageKey];

    if (activeDomain) {
      storageKeysToSync.forEach(storageKey => {
        localStorage.setItem(storageKey, activeDomain);
      });
    } else {
      storageKeysToSync.forEach(storageKey => {
        localStorage.removeItem(storageKey);
      });
    }
  }, [activeDomain, dashboardStorageKeys, legacyDashboardStorageKey, hydrated]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setActiveDomainState(null);
      setHydrated(false);

      if (typeof window !== 'undefined') {
        [...dashboardStorageKeys, legacyDashboardStorageKey].forEach(storageKey => {
          localStorage.removeItem(storageKey);
        });
      }
    }
  }, [status, dashboardStorageKeys, legacyDashboardStorageKey]);

  const setActiveDomain = (domain: UserDomain) => {
    if (!domains.includes(domain)) return;

    if (typeof window !== 'undefined') {
      const storageKeysToSync = dashboardStorageKeys.length
        ? dashboardStorageKeys
        : [legacyDashboardStorageKey];
      storageKeysToSync.forEach(storageKey => {
        localStorage.setItem(storageKey, domain);
      });
    }

    setActiveDomainState(domain);
  };

  const clearDomain = () => {
    setActiveDomainState(null);
    if (typeof window !== 'undefined') {
      [...dashboardStorageKeys, legacyDashboardStorageKey].forEach(storageKey => {
        localStorage.removeItem(storageKey);
      });
    }
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
