'use client';

import { queryOptions, type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import CustomLoader from '@/components/custom-loader';
import type { ApiResponse } from '@/services/client';
import {
  getOrganisationByUuid,
  type Organisation,
  type UserOrganisationAffiliationDto,
} from '@/services/client';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { routeSegmentFromPath } from '@/src/features/dashboard/lib/dashboard-url';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

type OrganisationContextValue = Organisation | null;

const OrganisationContext = createContext<OrganisationContextValue>(null);

export const useOrganisation = () => useContext(OrganisationContext);

export default function OrganisationProvider({
  children,
  initialOrganisation,
  initialUpdatedAt,
}: {
  children: ReactNode;
  /** Organisation read during the server render; seeds the query so children render at once. */
  initialOrganisation?: OrganisationContextValue;
  initialUpdatedAt?: number;
}) {
  const { data: session } = useSession();
  const userProfile = useUserProfile();
  const userDomain = useUserDomain();
  const router = useRouter();
  const pathname = usePathname();
  const identity = session?.identity;

  const [storedOrgId, setStoredOrgId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const affiliations: UserOrganisationAffiliationDto[] =
    userProfile?.organisation_affiliations ?? [];
  const activeAffiliation: UserOrganisationAffiliationDto | undefined =
    affiliations.find(org => org.active) ?? affiliations[0];

  const storageKey = useMemo(() => {
    const identifier = userProfile?.uuid ?? identity?.uuid ?? userProfile?.email;
    return identifier ? `organisation:last:${identifier}` : null;
  }, [userProfile?.uuid, identity?.uuid, userProfile?.email]);

  useEffect(() => {
    if (hydrated) return;
    if (typeof window === 'undefined') return;
    if (!storageKey) {
      setHydrated(true);
      return;
    }
    const cachedId = window.localStorage.getItem(storageKey);
    setStoredOrgId(cachedId);
    setHydrated(true);
  }, [hydrated, storageKey]);

  const activeOrgId =
    activeAffiliation?.organisation_uuid ??
    initialOrganisation?.uuid ??
    identity?.organisationUuid ??
    storedOrgId ??
    null;

  const isOrgDomain = (domain: string) =>
    domain === 'organisation' || domain === 'organisation_user';
  const hasOrgDomain =
    userDomain.domains.some(isOrgDomain) || (identity?.domains ?? []).some(isOrgDomain);
  // Only organisation pages need the org before rendering; other roles must not wait on it.
  const isOrgRoute = routeSegmentFromPath(pathname) === 'organisation';

  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey && activeOrgId) {
      window.localStorage.setItem(storageKey, activeOrgId);
    }
  }, [storageKey, activeOrgId]);

  useEffect(() => {
    if (hasOrgDomain && hydrated && !activeOrgId && !userProfile?.isLoading) {
      router.replace('/onboarding/organisation');
    }
  }, [hasOrgDomain, hydrated, activeOrgId, userProfile?.isLoading, router]);

  const seed =
    initialOrganisation && initialOrganisation.uuid === activeOrgId
      ? initialOrganisation
      : undefined;

  const { data, isLoading } = useQuery(
    createQueryOptions(activeOrgId, {
      enabled: hasOrgDomain && !!activeOrgId && (!!seed || !!session?.user),
      initialData: seed,
      initialDataUpdatedAt: seed ? initialUpdatedAt : undefined,
    })
  );

  if (seed) {
    return (
      <OrganisationContext.Provider value={data ?? seed}>{children}</OrganisationContext.Provider>
    );
  }

  // If no organisation is attached and user is not in an organisation domain, just render children without fetching
  if ((!activeOrgId || !session?.user) && !hasOrgDomain) {
    return <OrganisationContext.Provider value={null}>{children}</OrganisationContext.Provider>;
  }

  if (hasOrgDomain && !activeOrgId && isOrgRoute) {
    return <CustomLoader />;
  }

  return (
    <OrganisationContext.Provider value={data ?? null}>
      {isLoading && isOrgRoute ? <CustomLoader /> : children}
    </OrganisationContext.Provider>
  );
}

function createQueryOptions(
  organizationUuid: string | null,
  options?: Omit<UseQueryOptions<OrganisationContextValue>, 'queryKey' | 'queryFn' | 'staleTime'>
) {
  return queryOptions({
    ...options,
    queryKey: ['organization', organizationUuid],
    queryFn: async () => {
      if (!organizationUuid) return null;

      const orgResp = await getOrganisationByUuid({ path: { uuid: organizationUuid } });
      const orgRespData = orgResp.data as ApiResponse;

      if (!orgRespData.data || orgRespData.error) {
        return null;
      }

      return { ...orgRespData.data } as OrganisationContextValue;
    },
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
