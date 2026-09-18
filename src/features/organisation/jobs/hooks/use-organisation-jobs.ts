'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { extractPage } from '@/lib/api-helpers';
import type { ClassMarketplaceJob } from '@/services/client';
import { listJobsOptions } from '@/services/client/@tanstack/react-query.gen';

const JOB_PAGE = { page: 0, size: 100 };

/** One place builds the jobs query, so the Jobs list and the class picker share a cache entry. */
export function useOrganisationJobs(organisationUuid: string, branchUuid?: string) {
  const query = useQuery({
    ...listJobsOptions({
      query: {
        organisation_uuid: organisationUuid,
        ...(branchUuid ? { branch_uuid: branchUuid } : {}),
        pageable: JOB_PAGE,
      },
    }),
    enabled: Boolean(organisationUuid),
  });
  const jobs = useMemo(() => extractPage<ClassMarketplaceJob>(query.data).items, [query.data]);
  return { jobs, query };
}
