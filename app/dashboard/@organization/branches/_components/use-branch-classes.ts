'use client';

import { extractPage } from '@/lib/api-helpers';
import type { ClassDefinition, OrganisationResource } from '@/services/client';
import { ResourceTypeEnum } from '@/services/client';
import {
  getClassDefinitionsForOrganisationOptions,
  listResourcesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Resolves the classes that run at a single training branch.
 *
 * A class has no direct branch link — the only tie is
 * `class.venue_resource_uuid` → the venue resource's `branch_uuid`. So we fetch
 * this branch's VENUE resources, then filter the organisation's classes to those
 * whose venue belongs to the branch. There is no server endpoint that does this
 * join, hence the client-side match here.
 */
export function useBranchClasses(organisationUuid: string, branchUuid: string) {
  const enabled = Boolean(organisationUuid && branchUuid);

  const venuesQuery = useQuery({
    ...listResourcesOptions({
      path: { organisationUuid },
      query: {
        pageable: { page: 0, size: 100 },
        resource_type: ResourceTypeEnum.VENUE,
        branch_uuid: branchUuid,
      },
    }),
    enabled,
  });

  const venueUuids = useMemo(() => {
    const set = new Set<string>();
    for (const resource of extractPage<OrganisationResource>(venuesQuery.data).items) {
      if (resource.uuid) set.add(resource.uuid);
    }
    return set;
  }, [venuesQuery.data]);

  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled,
  });

  const branchClasses = useMemo(() => {
    const all = (classesQuery.data?.data ?? []) as ClassDefinition[];
    return all.filter(
      classDef => classDef.venue_resource_uuid && venueUuids.has(classDef.venue_resource_uuid)
    );
  }, [classesQuery.data, venueUuids]);

  return {
    branchClasses,
    venueUuids,
    isLoading: venuesQuery.isLoading || classesQuery.isLoading,
    isError: venuesQuery.isError || classesQuery.isError,
  };
}
