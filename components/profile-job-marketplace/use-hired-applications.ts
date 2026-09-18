'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import type { ClassMarketplaceJobApplication } from '@/services/client';
import { listMyApplicationsOptions } from '@/services/client/@tanstack/react-query.gen';
import { myApplicationsQueryArgs } from '@/src/features/instructor-jobs/job-queries';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { hiredJobData, isHiredApplication } from './hired-jobs';

export type HiredApplication = ClassMarketplaceJobApplication & { job_uuid: string };

/** Hired and class-created applications, one per job, from the cache the Jobs tab counts share. */
export function useHiredApplications() {
  const profile = useUserProfile();
  const result = useQuery({
    ...listMyApplicationsOptions(myApplicationsQueryArgs),
    enabled: Boolean(profile?.uuid),
    staleTime: STALE_TIMES.live,
    select: hiredJobData,
  });

  const applications = useMemo(() => {
    const seen = new Set<string>();
    return (result.data?.content ?? []).filter((row): row is HiredApplication => {
      if (!isHiredApplication(row.status) || !row.job_uuid || seen.has(row.job_uuid)) return false;
      seen.add(row.job_uuid);
      return true;
    });
  }, [result.data]);

  return {
    applications,
    isPending: result.isPending,
    error: result.error,
    refetch: result.refetch,
  };
}
