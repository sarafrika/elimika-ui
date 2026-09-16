'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import { listMyApplicationsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { hiredJobData } from './hired-jobs';

export function useHiredApplications(page: number) {
  const profile = useUserProfile();
  const result = useQuery({
    ...listMyApplicationsOptions({
      query: { status: 'hired', pageable: { page, size: 6 } },
    }),
    enabled: Boolean(profile?.uuid),
    staleTime: STALE_TIMES.live,
    select: hiredJobData,
  });
  const applications = useMemo(() => {
    const seen = new Set<string>();
    return (result.data?.content ?? []).filter(application => {
      if (
        application.status?.toLowerCase() !== 'hired' ||
        !application.job_uuid ||
        seen.has(application.job_uuid)
      ) {
        return false;
      }
      seen.add(application.job_uuid);
      return true;
    });
  }, [result.data]);

  return {
    applications,
    isPending: result.isPending,
    isFetching: result.isFetching,
    error: result.error,
    hasNext: Boolean(result.data?.metadata?.hasNext),
    total: result.data?.metadata?.totalElements ?? 0,
    refetch: result.refetch,
  };
}
