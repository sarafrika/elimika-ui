'use client';

import { useClassesByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import type { ClassDefinition } from '@/services/client';
import { getAllClassDefinitionsInfiniteOptions } from '@/services/client/@tanstack/react-query.gen';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { nextInstructorPage } from './instructor-data';

const PAGE_SIZE = 100;

function useOfferingClasses(
  instructorIds: string[],
  offeringIds: string[],
  kind: 'course' | 'program'
) {
  // These filters are documented by the API but omitted from its generated query type.
  const query = {
    default_instructor_uuid_in: instructorIds.join(','),
    [`${kind}_uuid_in`]: offeringIds.join(','),
    pageable: { page: 0, size: PAGE_SIZE },
  };
  return useInfiniteQuery({
    ...getAllClassDefinitionsInfiniteOptions({ query }),
    enabled: instructorIds.length > 0 && offeringIds.length > 0,
    staleTime: STALE_TIMES.entity,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const page = nextInstructorPage(lastPage, pages.length, PAGE_SIZE);
      return page == null
        ? undefined
        : { query: { ...query, pageable: { page, size: PAGE_SIZE } } };
    },
  });
}

export function useApprovedInstructorClasses(
  instructorIds: string[],
  courseIds: string[],
  programIds: string[]
) {
  const courseQuery = useOfferingClasses(instructorIds, courseIds, 'course');
  const programQuery = useOfferingClasses(instructorIds, programIds, 'program');
  const classes = useMemo(() => {
    const instructors = new Set(instructorIds);
    const courses = new Set(courseIds);
    const programs = new Set(programIds);
    const definitions = new Map<string, ClassDefinition>();
    for (const query of [courseQuery, programQuery]) {
      for (const page of query.data?.pages ?? []) {
        if (page.error || page.success === false) continue;
        for (const { class_definition: item } of page.data?.content ?? []) {
          // Organisation-owned classes assigned to an instructor are not their own classes.
          if (
            item?.uuid &&
            !item.organisation_uuid &&
            instructors.has(item.default_instructor_uuid) &&
            ((item.course_uuid && courses.has(item.course_uuid)) ||
              (item.program_uuid && programs.has(item.program_uuid)))
          )
            definitions.set(item.uuid, item);
        }
      }
    }
    return [...definitions.values()];
  }, [courseQuery.data, programQuery.data, instructorIds, courseIds, programIds]);
  const classIds = useMemo(
    () => classes.flatMap(item => (item.uuid ? [item.uuid] : [])),
    [classes]
  );
  const {
    classMap,
    isLoading: countsLoading,
    isError: countsError,
    refetch: refetchCounts,
  } = useClassesByIds(classIds);
  const queries = [courseQuery, programQuery];
  return {
    classes,
    classMap,
    countsLoading,
    countsError,
    isLoading: queries.some(query => query.isLoading),
    hasError: queries.some(
      query => query.isError || query.data?.pages.some(page => page.error || page.success === false)
    ),
    hasNextPage: queries.some(query => query.hasNextPage),
    isFetching: queries.some(query => query.isFetching),
    loadMore: () =>
      Promise.all(
        queries
          .filter(query => query.hasNextPage && !query.isFetching)
          .map(query => query.fetchNextPage())
      ),
    refetch: () => Promise.all([...queries.map(query => query.refetch()), refetchCounts()]),
  };
}
