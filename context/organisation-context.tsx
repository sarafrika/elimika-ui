'use client';

import type { ApiResponse, SearchResponse } from '@/services/client';
import {
  getOrganisationByUuid,
  getTrainingBranchesByOrganisation,
  getUsersByOrganisation,
  type Organisation,
  type TrainingBranch,
  type User,
} from '@/services/client';
import { queryOptions, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { createContext, type ReactNode, useContext } from 'react';
import CustomLoader from '../components/custom-loader';
import { useUserProfile } from './profile-context';

type OrganisationContextValue = (Organisation & { branches?: TrainingBranch[]; users?: User[] }) | null;

const OrganisationContext = createContext<OrganisationContextValue>(null);

export const useOrganisation = () => useContext(OrganisationContext);

export default function OrganisationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const userProfile = useUserProfile();

  const activeOrgId =
    userProfile?.organisation_affiliations && userProfile.organisation_affiliations.length > 0
      ? (
          userProfile.organisation_affiliations.find(org => org.active) ??
          userProfile.organisation_affiliations[0]
        )?.organisationUuid
      : null;

  // If no organisation is attached, just render children without fetching
  if (!activeOrgId || !session?.user) {
    return <OrganisationContext.Provider value={null}>{children}</OrganisationContext.Provider>;
  }

  const { data, isLoading } = useQuery(
    createQueryOptions(activeOrgId, {
      enabled: !!userProfile && !!session?.user && !!activeOrgId,
    })
  );

  return (
    <OrganisationContext.Provider value={data ?? null}>
      {isLoading ? <CustomLoader /> : children}
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

      const organisationData = {
        ...orgRespData.data,
      } as OrganisationContextValue;

      // Branches and users are optional; swallow errors to stay lean
      try {
        const branchesResp = (await getTrainingBranchesByOrganisation({
          path: { uuid: organisationData?.uuid! },
          query: { pageable: { page: 0, size: 5 } },
        })) as ApiResponse;

        const branchesData = branchesResp.data as SearchResponse;
        if (branchesData.data?.content && organisationData) {
          organisationData.branches = branchesData.data.content as unknown as TrainingBranch[];
        }
      } catch (_error) {
      }

      try {
        const orgUsersResp = (await getUsersByOrganisation({
          path: { uuid: organisationData?.uuid! },
          query: { pageable: { page: 0, size: 5 } },
        })) as ApiResponse;

        const orgUsersData = orgUsersResp.data as SearchResponse;
        if (orgUsersData.data?.content && organisationData) {
          organisationData.users = orgUsersData.data.content as unknown as User[];
        }
      } catch (_error) {
      }

      return organisationData;
    },
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
