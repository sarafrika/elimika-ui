'use client';

import { useClassesByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import { getAllClassDefinitionsInfiniteOptions } from '@/services/client/@tanstack/react-query.gen';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { nextInstructorPage } from './instructor-data';

const PAGE_SIZE = 100;

export function useApprovedOrganisationClasses(organisationIds: string[], courseIds: string[]) {
  // The API supports these filters, though its generated query type omits them.
  const query = {
    organisation_uuid_in: organisationIds.join(','),
    course_uuid_in: courseIds.join(','),
    pageable: { page: 0, size: PAGE_SIZE },
  };
  const classesQuery = useInfiniteQuery({
    ...getAllClassDefinitionsInfiniteOptions({ query }),
    enabled: organisationIds.length > 0 && courseIds.length > 0,
    staleTime: STALE_TIMES.entity,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const page = nextInstructorPage(lastPage, pages.length, PAGE_SIZE);
      return page == null
        ? undefined
        : { query: { ...query, pageable: { page, size: PAGE_SIZE } } };
    },
  });
  const classes = useMemo(() => {
    const organisations = new Set(organisationIds);
    const courses = new Set(courseIds);
    const definitions = (classesQuery.data?.pages ?? []).flatMap(page =>
      page.error || page.success === false
        ? []
        : (page.data?.content ?? []).flatMap(({ class_definition: item }) =>
            item?.uuid &&
            item.organisation_uuid &&
            organisations.has(item.organisation_uuid) &&
            item.course_uuid &&
            courses.has(item.course_uuid)
              ? [item]
              : []
          )
    );
    return [...new Map(definitions.map(item => [item.uuid, item])).values()];
  }, [classesQuery.data, organisationIds, courseIds]);
  const classIds = useMemo(
    () => classes.flatMap(item => (item.uuid ? [item.uuid] : [])),
    [classes]
  );
  const counts = useClassesByIds(classIds);

  return {
    classes,
    classMap: counts.classMap,
    isLoading: classesQuery.isLoading,
    countsLoading: counts.isLoading,
    countsError: counts.isError,
    hasError:
      classesQuery.isError ||
      Boolean(classesQuery.data?.pages.some(page => page.error || page.success === false)),
    hasNextPage: Boolean(classesQuery.hasNextPage),
    isFetching: classesQuery.isFetching,
    loadMore: () => classesQuery.fetchNextPage(),
    refetch: () => Promise.all([classesQuery.refetch(), counts.refetch()]),
  };
}
