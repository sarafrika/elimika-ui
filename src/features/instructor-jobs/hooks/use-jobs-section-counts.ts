'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { isLiveApplication } from '@/components/profile-job-marketplace/application-status';
import { isHiredApplication } from '@/components/profile-job-marketplace/hired-jobs';
import { STALE_TIMES } from '@/lib/query-client';
import {
  listJobsOptions,
  listMyApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

import { myApplicationsQueryArgs, openJobsCountQueryArgs } from '../job-queries';

export type JobsSectionCounts = {
  openJobs: number | undefined;
  liveApplications: number | undefined;
  hiredJobs: number | undefined;
};

/** Tab counts for the Jobs area; each stays undefined until its query has an answer. */
export function useJobsSectionCounts(): JobsSectionCounts {
  const profile = useUserProfile();
  const enabled = Boolean(profile?.uuid);

  const openJobs = useQuery({
    ...listJobsOptions(openJobsCountQueryArgs),
    enabled,
    staleTime: STALE_TIMES.live,
  });
  const applications = useQuery({
    ...listMyApplicationsOptions(myApplicationsQueryArgs),
    enabled,
    staleTime: STALE_TIMES.live,
  });

  const openTotal = openJobs.data?.data?.metadata?.totalElements;
  const rows = applications.data?.data?.content;

  const applicationCounts = useMemo(() => {
    if (!rows) return { liveApplications: undefined, hiredJobs: undefined };
    const hiredJobUuids = new Set(
      rows.flatMap(row => (isHiredApplication(row.status) && row.job_uuid ? [row.job_uuid] : []))
    );
    return {
      liveApplications: rows.filter(
        row => isLiveApplication(row.status) && !isHiredApplication(row.status)
      ).length,
      hiredJobs: hiredJobUuids.size,
    };
  }, [rows]);

  return {
    openJobs: openTotal === undefined ? undefined : Number(openTotal),
    ...applicationCounts,
  };
}
