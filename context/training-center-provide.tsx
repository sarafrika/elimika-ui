'use client';

import type { TrainingCenter } from '@/lib/types';
import {
  type ApiResponse,
  getOrganisationByUuid,
  getTrainingBranchesByOrganisation,
  getUsersByOrganisation,
  type SearchResponse,
  type TrainingBranch,
  type User,
} from '@/services/client';
import { queryOptions, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { createContext, type ReactNode, useContext } from 'react';
import CustomLoader from '../components/custom-loader';
import { useUserProfile } from './profile-context';

const TrainingCenterContext = createContext<TrainingCenter | undefined>(undefined);
export const useTrainingCenter = () => useContext(TrainingCenterContext);

export default function TrainingCenterProvider({ children }: { children: ReactNode }) {
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
    return (
      <TrainingCenterContext.Provider value={undefined}>{children}</TrainingCenterContext.Provider>
    );
  }

  const { data, isLoading } = useQuery(
    createQueryOptions(activeOrgId!, {
      enabled: !!userProfile && !!session && !!session?.user && !!activeOrgId,
    })
  );

  return (
    <TrainingCenterContext.Provider value={data as TrainingCenter}>
      {isLoading ? <CustomLoader /> : children}
    </TrainingCenterContext.Provider>
  );
}

function createQueryOptions(
  organizationUuid: string | null,
  options?: Omit<UseQueryOptions<TrainingCenter | null>, 'queryKey' | 'queryFn' | 'staleTime'>
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

      const organizationData = {
        ...orgRespData.data,
      } as TrainingCenter;

      // Branches and users are optional; if not present or errors occur, ignore silently.
      try {
        const branchesResp = (await getTrainingBranchesByOrganisation({
          path: { uuid: organizationData.uuid! },
          query: { pageable: { page: 0, size: 5 } },
        })) as ApiResponse;

        const branchesData = branchesResp.data as SearchResponse;
        if (branchesData.data?.content) {
          organizationData.branches = branchesData.data.content as unknown as TrainingBranch[];
        }
      } catch (_error) {
      }

      try {
        const orgUsersResp = (await getUsersByOrganisation({
          path: { uuid: organizationData.uuid! },
          query: { pageable: { page: 0, size: 5 } },
        })) as ApiResponse;

        const orgUsersData = orgUsersResp.data as SearchResponse;
        if (orgUsersData.data?.content) {
          organizationData.users = orgUsersData.data.content as unknown as User[];
        }
      } catch (_error) {
      }

      return organizationData;
    },
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
