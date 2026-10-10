'use client';

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-client';
import { getStudentCourseOverviewOptions } from '@/services/client/@tanstack/react-query.gen';
import type { StudentCourseOverviewItem } from '@/services/client/types.gen';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

/** The endpoint caps a page at 50 classes. */
const OVERVIEW_PAGE_SIZE = 50;
const NO_ITEMS: StudentCourseOverviewItem[] = [];

/*
 * One request for every enrolled class with its course, instructor, next session,
 * progress and pending assessment counts. `needsFallback` flips on when it fails
 * (404 on an older backend), so callers can run their legacy chains instead.
 */
export function useStudentCourseOverview(studentUuidOverride?: string) {
  const profile = useUserProfile();
  const studentUuid = studentUuidOverride ?? profile?.student?.uuid;
  const isResolving = !studentUuid && Boolean(profile?.isLoading);

  const query = useQuery({
    ...getStudentCourseOverviewOptions({
      path: { studentUuid: studentUuid as string },
      query: { pageable: { page: 0, size: OVERVIEW_PAGE_SIZE } },
    }),
    enabled: Boolean(studentUuid),
    staleTime: STALE_TIMES.live,
    refetchOnWindowFocus: false,
  });

  const page = query.data?.data?.enrollments;
  const needsFallback = query.isError && !query.data;

  return {
    items: page?.content ?? NO_ITEMS,
    totalCount: Number(page?.metadata?.totalElements ?? page?.content?.length ?? 0),
    isLoading: isResolving || (Boolean(studentUuid) && query.isLoading && !query.data),
    isReady: Boolean(query.data),
    needsFallback,
    error: query.error,
    refetch: query.refetch,
  };
}
