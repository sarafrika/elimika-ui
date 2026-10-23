'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import {
  hasApiError,
  nextWorkbookPage,
  WORKBOOK_PAGE_SIZE,
} from '@/components/lesson/workbook-data';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getClassSchedulesOptions,
  searchEnrollmentsInfiniteOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { buildClassAttendance } from './attendance-matrix';

export function useInstructorAttendanceData(classIds: string[]) {
  const schedules = useQuery({
    ...getClassSchedulesOptions({ query: { class_uuids: classIds } }),
    enabled: classIds.length > 0,
    staleTime: STALE_TIMES.live,
  });
  const classFilter = classIds.join(',');
  const enrollments = useInfiniteQuery({
    ...searchEnrollmentsInfiniteOptions({
      query: {
        searchParams: { class_definition_uuid_in: classFilter },
        pageable: { size: WORKBOOK_PAGE_SIZE },
      },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: Boolean(classFilter),
    staleTime: STALE_TIMES.live,
  });
  const hasError =
    schedules.isError ||
    hasApiError(schedules.data) ||
    enrollments.isError ||
    Boolean(enrollments.data?.pages.some(hasApiError));
  const { hasNextPage, isFetching, fetchNextPage } = enrollments;

  // Finish only the visible classes' scoped pages before showing totals; partial pages
  // must never make a student look absent or make a class's counts look complete.
  useEffect(() => {
    if (classFilter && hasNextPage && !isFetching && !hasError) void fetchNextPage();
  }, [classFilter, hasNextPage, isFetching, hasError, fetchNextPage]);

  const matrices = useMemo(() => {
    const sessions = hasApiError(schedules.data) ? [] : (schedules.data?.data ?? []);
    const records =
      enrollments.data?.pages.flatMap(page =>
        hasApiError(page) ? [] : (page.data?.content ?? [])
      ) ?? [];
    return new Map(classIds.map(id => [id, buildClassAttendance(id, sessions, records)]));
  }, [classIds, schedules.data, enrollments.data]);

  return {
    matrices,
    isLoading:
      classIds.length > 0 &&
      (schedules.isLoading || enrollments.isLoading || Boolean(hasNextPage && !hasError)),
    isError: hasError,
    retry: () => {
      void schedules.refetch();
      void enrollments.refetch();
    },
  };
}
