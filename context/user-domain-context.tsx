'use client';

import { getDashboardStorageKey } from '@/lib/utils';
import type { UserDomain } from '@/lib/types';
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

export function UserDomainProvider({ children }: { children: ReactNode }) {
  const profile = useUserProfile();
  const { status } = useSession();
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

    const storedDomain =
      typeof window !== 'undefined'
        ? (localStorage.getItem(dashboardStorageKey) as UserDomain | null)
        : null;

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
      localStorage.setItem(dashboardStorageKey, activeDomain);
    } else {
      localStorage.removeItem(dashboardStorageKey);
    }
  }, [activeDomain, dashboardStorageKey, hydrated]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setActiveDomainState(null);
      setHydrated(false);

      if (typeof window !== 'undefined') {
        localStorage.removeItem(dashboardStorageKey);
      }
    }
  }, [status, dashboardStorageKey]);

  const setActiveDomain = (domain: UserDomain) => {
    if (!domains.includes(domain)) return;
    setActiveDomainState(domain);
  };

  const clearDomain = () => {
    setActiveDomainState(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(dashboardStorageKey);
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
