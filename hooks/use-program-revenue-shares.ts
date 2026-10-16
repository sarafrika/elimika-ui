'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useCoursesByIds } from '@/hooks/use-batched-lookups';
import { programCourseIds, programRevenueShares } from '@/lib/course-creator/revenue-shares';
import { STALE_TIMES } from '@/lib/query-client';
import { searchProgramCoursesInfiniteOptions } from '@/services/client/@tanstack/react-query.gen';

/** Two batched reads for the visible program rows: memberships, then their course shares. */
export function useProgramRevenueShares(programIds: string[]) {
  const ids = useMemo(() => [...new Set(programIds.filter(Boolean))].sort(), [programIds]);
  const memberships = useInfiniteQuery({
    ...searchProgramCoursesInfiniteOptions({
      query: {
        searchParams: { program_uuid_in: ids.join(',') },
        pageable: { page: 0, size: 100 },
      },
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.error || lastPage.success === false) return undefined;
      const metadata = lastPage.data?.metadata;
      const page = metadata?.pageNumber ?? pages.length - 1;
      if (metadata?.hasNext === false || metadata?.last === true) return undefined;
      return metadata?.hasNext || (metadata?.totalPages ?? 0) > page + 1 ? page + 1 : undefined;
    },
    enabled: ids.length > 0,
    staleTime: STALE_TIMES.entity,
  });
  const failed =
    memberships.isError ||
    Boolean(
      memberships.data?.pages.some(page => {
        if (page.error || page.success === false || !page.data?.content) return true;
        const metadata = page.data.metadata;
        return (
          !metadata ||
          (metadata.hasNext === undefined &&
            metadata.last === undefined &&
            metadata.totalPages === undefined)
        );
      })
    );
  const { hasNextPage, isFetching, fetchNextPage } = memberships;
  useEffect(() => {
    if (ids.length && hasNextPage && !isFetching && !failed) void fetchNextPage();
  }, [ids.length, hasNextPage, isFetching, failed, fetchNextPage]);
  const pendingMemberships = ids.length > 0 && !failed && (memberships.isPending || hasNextPage);
  const ready = ids.length > 0 && !failed && !pendingMemberships;
  const coursesByProgram = useMemo(
    () =>
      programCourseIds(
        ids,
        ready ? (memberships.data?.pages.flatMap(page => page.data?.content ?? []) ?? []) : []
      ),
    [ids, ready, memberships.data]
  );
  const courseIds = useMemo(
    () => [...new Set([...coursesByProgram.values()].flat())].sort(),
    [coursesByProgram]
  );
  const courses = useCoursesByIds(courseIds);
  const shares = useMemo(() => {
    return new Map(
      ids.map(uuid => [
        uuid,
        ready && !courses.isLoading && !courses.isError
          ? programRevenueShares(coursesByProgram.get(uuid) ?? [], courses.courseMap)
          : undefined,
      ])
    );
  }, [ids, ready, coursesByProgram, courses.courseMap, courses.isLoading, courses.isError]);
  const retry = () => {
    void memberships.refetch();
    void courses.refetch();
  };
  return { shares, pending: pendingMemberships || courses.isLoading, retry };
}
