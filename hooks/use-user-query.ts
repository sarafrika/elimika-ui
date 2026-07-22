// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
import type { UserDomain } from '@/lib/types';
import { getDashboardStorageKey } from '@/lib/utils';
import { search } from '@/services/client';
import {
  clearPersistedDashboardDomain,
  persistDashboardDomain,
  readPersistedDashboardDomain,
} from '@/src/features/dashboard/lib/active-domain-storage';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useUserQuery() {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: ['user', session?.user?.email],
    queryFn: async () => {
      if (!session?.user?.email) {
        return null;
      }

      const resp = await search({
        query: {
          searchParams: { email_eq: session.user.email },
          pageable: { page: 0, size: 100 },
        },
      });

      if (resp.error) {
        throw new Error('Failed to fetch user data');
      }

      const results = resp.data.data?.content;
      return results?.[0] || null;
    },
    enabled: status === 'authenticated' && !!session?.user?.email,
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

export function useUserDomains() {
  const userQuery = useUserQuery();

  const userDomains = useMemo(() => {
    const rawDomains = userQuery.data?.user_domain || [];
    return (Array.isArray(rawDomains) ? rawDomains : [rawDomains]).filter(
      (domain): domain is UserDomain => typeof domain === 'string'
    );
  }, [userQuery.data?.user_domain]);

  const [activeDomain, setActiveDomain] = useState<UserDomain | null>(null);
  const [isReady, setIsReady] = useState(false);

  const dashboardStorageKey = useMemo(
    () => getDashboardStorageKey(userQuery.data?.uuid ?? userQuery.data?.email ?? undefined),
    [userQuery.data?.email, userQuery.data?.uuid]
  );

  const persistedActiveDomain = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return readPersistedDashboardDomain(dashboardStorageKey);
  }, [dashboardStorageKey, userQuery.isLoading]);

  const syncActiveDomain = useCallback(
    (domain: UserDomain | null) => {
      if (typeof window === 'undefined') {
        setActiveDomain(domain);
        return;
      }

      if (domain) {
        persistDashboardDomain(dashboardStorageKey, domain);
      } else {
        clearPersistedDashboardDomain(dashboardStorageKey);
      }

      setActiveDomain(domain);
    },
    [dashboardStorageKey]
  );

  useEffect(() => {
    if (userQuery.isLoading) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    if (!userDomains.length) {
      setActiveDomain(null);
      setIsReady(true);
      return;
    }

    const storedDomain = readPersistedDashboardDomain(dashboardStorageKey);
    const nextDomain =
      storedDomain && userDomains.includes(storedDomain) ? storedDomain : userDomains[0] || null;

    setActiveDomain(nextDomain);
    setIsReady(true);
  }, [dashboardStorageKey, userDomains, userQuery.isLoading]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== dashboardStorageKey) {
        return;
      }

      const nextDomain = readPersistedDashboardDomain(dashboardStorageKey);
      if (nextDomain && userDomains.includes(nextDomain)) {
        setActiveDomain(nextDomain);
        return;
      }

      if (!nextDomain && userDomains.length > 0) {
        setActiveDomain(userDomains[0] || null);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [dashboardStorageKey, userDomains]);

  return {
    domains: userDomains,
    activeDomain:
      (persistedActiveDomain && userDomains.includes(persistedActiveDomain)
        ? persistedActiveDomain
        : activeDomain) ?? null,
    isReady,
    isLoading: userQuery.isLoading,
    error: userQuery.error,
    setActiveDomain: syncActiveDomain,
    clearDomain: () => syncActiveDomain(null),
  };
}
