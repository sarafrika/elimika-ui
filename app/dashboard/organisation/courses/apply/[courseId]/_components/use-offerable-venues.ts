'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { extractPage } from '@/lib/api-helpers';
import { STALE_TIMES } from '@/lib/query-client';
import {
  type OrganisationResource,
  ResourceTypeEnum,
  type TrainingBranch,
} from '@/services/client';
import {
  getTrainingBranchesByOrganisationOptions,
  listResourcesOptions,
} from '@/services/client/@tanstack/react-query.gen';

const VENUE_QUERY = {
  resource_type: ResourceTypeEnum.VENUE,
  active: true,
  pageable: { page: 0, size: 200 },
};
const BRANCH_QUERY = { pageable: { page: 0, size: 100 } };

export type VenueGroup = { branchUuid: string; branchName: string; venues: OrganisationResource[] };

/** The organisation's active venues, grouped by branch, for the application's venue picker. */
export function useOfferableVenues(organisationUuid: string, enabled: boolean) {
  const ready = enabled && Boolean(organisationUuid);
  const venuesQuery = useQuery({
    ...listResourcesOptions({ path: { organisationUuid }, query: VENUE_QUERY }),
    enabled: ready,
    staleTime: STALE_TIMES.entity,
  });
  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: BRANCH_QUERY,
    }),
    enabled: ready,
    staleTime: STALE_TIMES.entity,
  });

  const venues = useMemo(
    () => extractPage<OrganisationResource>(venuesQuery.data).items.filter(venue => venue.uuid),
    [venuesQuery.data]
  );

  const groups = useMemo<VenueGroup[]>(() => {
    const names = new Map<string, string>();
    for (const branch of extractPage<TrainingBranch>(branchesQuery.data).items) {
      if (branch.uuid) names.set(branch.uuid, branch.branch_name || 'Untitled branch');
    }
    const byBranch = new Map<string, OrganisationResource[]>();
    for (const venue of venues) {
      const key = venue.branch_uuid ?? '';
      byBranch.set(key, [...(byBranch.get(key) ?? []), venue]);
    }
    return [...byBranch.entries()].map(([branchUuid, rows]) => ({
      branchUuid,
      branchName: names.get(branchUuid) ?? 'Branch',
      venues: rows,
    }));
  }, [venues, branchesQuery.data]);

  const byUuid = useMemo(
    () => new Map(venues.map(venue => [venue.uuid as string, venue])),
    [venues]
  );

  return { venues, groups, byUuid, query: venuesQuery };
}
