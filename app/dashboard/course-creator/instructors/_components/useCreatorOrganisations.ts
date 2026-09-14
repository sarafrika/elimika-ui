'use client';

import { useCourseCreator } from '@/context/course-creator-context';
import { useCoursesByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import { searchTrainingApplicationsInfiniteOptions } from '@/services/client/@tanstack/react-query.gen';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { groupApprovedOrganisationCourses } from './organisation-data';

const PAGE_SIZE = 50;

export function useCreatorOrganisations(organisationUuid?: string) {
  const { profile, isLoading: profileLoading } = useCourseCreator();
  const creatorUuid = profile?.uuid;
  const searchParams = {
    ...(creatorUuid ? { course_creator_uuid: creatorUuid } : {}),
    applicant_type: 'organisation',
    status: 'approved',
    ...(organisationUuid ? { applicant_uuid_eq: organisationUuid } : {}),
  };
  const applicationsQuery = useInfiniteQuery({
    ...searchTrainingApplicationsInfiniteOptions({
      query: {
        searchParams,
        pageable: { page: 0, size: PAGE_SIZE },
      },
    }),
    enabled: Boolean(creatorUuid),
    staleTime: STALE_TIMES.live,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.error || lastPage.success === false) return undefined;
      const metadata = lastPage.data?.metadata;
      const nextPage = (metadata?.pageNumber ?? pages.length - 1) + 1;
      const hasNext =
        metadata?.hasNext ??
        (metadata?.totalPages != null
          ? nextPage < metadata.totalPages
          : metadata?.last === true
            ? false
            : (lastPage.data?.content?.length ?? 0) === PAGE_SIZE);
      return hasNext
        ? { query: { searchParams, pageable: { page: nextPage, size: PAGE_SIZE } } }
        : undefined;
    },
  });
  const groups = useMemo(
    () =>
      groupApprovedOrganisationCourses(
        creatorUuid
          ? (applicationsQuery.data?.pages.flatMap(page =>
              page.error || page.success === false ? [] : (page.data?.content ?? [])
            ) ?? [])
          : [],
        organisationUuid
      ),
    [applicationsQuery.data, creatorUuid, organisationUuid]
  );
  const courseIds = useMemo(() => [...new Set(groups.flatMap(group => group.courseIds))], [groups]);
  const { courseMap, isLoading: coursesLoading } = useCoursesByIds(courseIds);
  const hasError =
    applicationsQuery.isError ||
    Boolean(applicationsQuery.data?.pages.some(page => page.error || page.success === false));

  return {
    groups,
    courseIds,
    courseMap,
    applicationsQuery,
    hasError,
    hasProfile: Boolean(creatorUuid),
    isLoading: profileLoading || applicationsQuery.isLoading || coursesLoading,
  };
}
