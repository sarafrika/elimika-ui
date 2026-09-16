'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { extractPage } from '@/lib/api-helpers';
import { STALE_TIMES } from '@/lib/query-client';
import type { OrganisationResource, TrainingBranch } from '@/services/client';
import { ResourceTypeEnum } from '@/services/client';
import {
  getTrainingBranchesByOrganisationOptions,
  listResourcesOptions,
} from '@/services/client/@tanstack/react-query.gen';

const BRANCH_PAGE = { pageable: { page: 0, size: 100 } };
const RESOURCE_PAGE = { page: 0, size: 100 };

/** Refetches on focus so a pin set in another tab shows up when the organiser comes back. */
export function useOrganisationBranches(organisationUuid: string) {
  const query = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: BRANCH_PAGE,
    }),
    enabled: Boolean(organisationUuid),
    staleTime: STALE_TIMES.entity,
    refetchOnWindowFocus: 'always',
  });
  const branches = useMemo(() => extractPage<TrainingBranch>(query.data).items, [query.data]);
  return { branches, query };
}

/** Only the branch's own active venues and equipment can be held by a job there. */
export function useBranchResources(organisationUuid: string, branchUuid: string) {
  const enabled = Boolean(organisationUuid && branchUuid);
  const venuesQuery = useQuery({
    ...listResourcesOptions({
      path: { organisationUuid },
      query: {
        resource_type: ResourceTypeEnum.VENUE,
        branch_uuid: branchUuid,
        active: true,
        pageable: RESOURCE_PAGE,
      },
    }),
    enabled,
  });
  const equipmentQuery = useQuery({
    ...listResourcesOptions({
      path: { organisationUuid },
      query: {
        resource_type: ResourceTypeEnum.EQUIPMENT_POOL,
        branch_uuid: branchUuid,
        active: true,
        pageable: RESOURCE_PAGE,
      },
    }),
    enabled,
  });

  const venues = useMemo(
    () => extractPage<OrganisationResource>(venuesQuery.data).items,
    [venuesQuery.data]
  );
  const equipment = useMemo(
    () => extractPage<OrganisationResource>(equipmentQuery.data).items,
    [equipmentQuery.data]
  );

  return { venues, equipment, venuesQuery, equipmentQuery };
}
