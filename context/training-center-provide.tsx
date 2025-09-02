import { TrainingCenter } from '@/lib/types';
import {
  ApiResponse,
  getOrganisationByUuid,
  getTrainingBranchesByOrganisation,
  getUsersByOrganisation,
  SearchResponse,
  TrainingBranch,
  User,
} from '@/services/client';
import { queryOptions, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { createContext, ReactNode, useContext } from 'react';
import CustomLoader from '../components/custom-loader';
import { useUserProfile } from './profile-context';

const TrainingCenterContext = createContext<TrainingCenter | undefined>(undefined);
export const useTrainingCenter = () => useContext(TrainingCenterContext);

export default function TrainingCenterProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const userProfile = useUserProfile();
  const activeOrgId = userProfile && userProfile.organisation_affiliations && userProfile.organisation_affiliations.length > 0 ?
    (userProfile.organisation_affiliations.find(org => org.active) ?? userProfile.organisation_affiliations[0] ?? {}).organisationUuid : null;

  const { data, isLoading } = useQuery(
    createQueryOptions(activeOrgId!, {
      enabled: !!userProfile && !!session && !!session!.user && !!activeOrgId,
    }
    )
  );

  return (
    <TrainingCenterContext.Provider value={data as TrainingCenter}>
      {isLoading ? <CustomLoader /> : children}
    </TrainingCenterContext.Provider>
  );
}

function createQueryOptions(
  organizaition_uuid: string | null,
  options?: Omit<UseQueryOptions<TrainingCenter | null>, 'queryKey' | 'queryFn' | 'staleTime'>
) {
  return queryOptions({
    ...options,
    queryKey: ['organization'],
    queryFn: async () => {

      if (!organizaition_uuid) return null;

      const orgResp = await getOrganisationByUuid({
        path: {
          uuid: organizaition_uuid
        }
      });

      const orgRespData = orgResp.data as ApiResponse;
      console.log(orgRespData);

      if (!orgRespData.data || orgRespData.error) {
        return null;
      }

      const organizationData = {
        ...orgRespData.data,
      } as TrainingCenter;

      const branchesResp = (await getTrainingBranchesByOrganisation({
        path: {
          uuid: organizationData.uuid!,
        },
        query: {
          pageable: { page: 0, size: 5 },
        },
      })) as ApiResponse;

      const branchesData = branchesResp.data as SearchResponse;
      if (branchesData.data && branchesData.data.content)
        organizationData.branches = branchesData.data.content as unknown as TrainingBranch[];

      const orgUsersResp = (await getUsersByOrganisation({
        path: {
          uuid: organizationData.uuid!,
        },
        query: {
          pageable: { page: 0, size: 5 },
        },
      })) as ApiResponse;

      const orgUsersData = orgUsersResp.data as SearchResponse;
      if (orgUsersData.data && orgUsersData.data.content)
        organizationData.users = orgUsersData.data.content as unknown as User[];

      // TODO: get organization branches, courses, instructures and users
      return organizationData;
    },
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
