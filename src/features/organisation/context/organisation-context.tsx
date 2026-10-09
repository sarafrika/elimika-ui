'use client';

import { queryOptions, type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import type { ApiResponse } from '@/services/client';
import {
  getOrganisationByUuid,
  type Organisation,
  type UserOrganisationAffiliationDto,
} from '@/services/client';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

type OrganisationContextValue = Organisation | null;

const OrganisationContext = createContext<OrganisationContextValue>(null);
const OrganisationLoadingContext = createContext(false);

export const useOrganisation = () => useContext(OrganisationContext);
/** True while an org member's organisation is still resolving; children render meanwhile. */
export const useOrganisationLoading = () => useContext(OrganisationLoadingContext);

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
    storedOrgId ??
    identity?.organisationUuid ??
    null;

  const isOrgDomain = (domain: string) =>
    domain === 'organisation' || domain === 'organisation_user';
  const hasOrgDomain =
    userDomain.domains.some(isOrgDomain) || (identity?.domains ?? []).some(isOrgDomain);
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

  const { data, isPending } = useQuery(
    createQueryOptions(activeOrgId, {
      enabled: hasOrgDomain && hydrated && !!activeOrgId && (!!seed || !!session?.user),
      initialData: seed,
      initialDataUpdatedAt: seed ? initialUpdatedAt : undefined,
    })
  );

  // Never block children on the org: pages gate their own queries on organisation?.uuid.
  const value = data ?? seed ?? null;
  const loading =
    hasOrgDomain &&
    !value &&
    (!hydrated || Boolean(userProfile?.isLoading) || (!!activeOrgId && isPending));

  return (
    <OrganisationLoadingContext.Provider value={loading}>
      <OrganisationContext.Provider value={value}>{children}</OrganisationContext.Provider>
    </OrganisationLoadingContext.Provider>
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
