'use client';

import { useCourseCreator } from '@/context/course-creator-context';
import {
  useCoursesByIds,
  useInstructorsByIds,
  useProgramsByIds,
} from '@/hooks/use-batched-lookups';
import { logger } from '@/lib/logger';
import { STALE_TIMES } from '@/lib/query-client';
import {
  searchProgramTrainingApplicationsInfiniteOptions,
  searchTrainingApplicationsInfiniteOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import {
  groupInstructorOfferings,
  nextInstructorPage,
  type InstructorOffering,
} from './instructor-data';

const PAGE_SIZE = 50;

export function useCreatorInstructors(instructorUuid?: string) {
  const { profile, isLoading: profileLoading } = useCourseCreator();
  const creatorUuid = profile?.uuid;
  const searchParams = {
    ...(creatorUuid ? { course_creator_uuid: creatorUuid } : {}),
    applicant_type: 'instructor',
    status: 'approved',
    ...(instructorUuid ? { applicant_uuid_eq: instructorUuid } : {}),
  };
  const options = { query: { searchParams, pageable: { page: 0, size: PAGE_SIZE } } };
  const applicationsQuery = useInfiniteQuery({
    ...searchTrainingApplicationsInfiniteOptions(options),
    enabled: Boolean(creatorUuid),
    staleTime: STALE_TIMES.live,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const page = nextInstructorPage(lastPage, pages.length, PAGE_SIZE);
      return page == null
        ? undefined
        : { query: { searchParams, pageable: { page, size: PAGE_SIZE } } };
    },
  });
  const programApplicationsQuery = useInfiniteQuery({
    ...searchProgramTrainingApplicationsInfiniteOptions(options),
    enabled: Boolean(creatorUuid),
    staleTime: STALE_TIMES.live,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const page = nextInstructorPage(lastPage, pages.length, PAGE_SIZE);
      return page == null
        ? undefined
        : { query: { searchParams, pageable: { page, size: PAGE_SIZE } } };
    },
  });
  const groups = useMemo(
    () =>
      groupInstructorOfferings(
        creatorUuid
          ? (applicationsQuery.data?.pages.flatMap(page =>
              page.error || page.success === false ? [] : (page.data?.content ?? [])
            ) ?? [])
          : [],
        creatorUuid
          ? (programApplicationsQuery.data?.pages.flatMap(page =>
              page.error || page.success === false ? [] : (page.data?.content ?? [])
            ) ?? [])
          : [],
        instructorUuid
      ),
    [applicationsQuery.data, programApplicationsQuery.data, creatorUuid, instructorUuid]
  );
  const requestedCourseIds = useMemo(
    () => [...new Set(groups.flatMap(group => group.courseIds))].sort(),
    [groups]
  );
  const programIds = useMemo(
    () => [...new Set(groups.flatMap(group => group.programIds))].sort(),
    [groups]
  );

  const {
    courseMap,
    isLoading: coursesLoading,
    isSuccess: coursesLoaded,
    isError: coursesError,
    refetch: refetchCourses,
  } = useCoursesByIds(requestedCourseIds);
  const { programMap, isLoading: programsLoading } = useProgramsByIds(programIds);

  // Keep approval ids even when an older course's details cannot be resolved.
  // Linked classes and enrollments still belong in the creator's instructor view.
  const instructorIds = useMemo(() => groups.map(group => group.uuid).sort(), [groups]);
  const courseIds = requestedCourseIds;
  const { instructorMap, isLoading: instructorsLoading } = useInstructorsByIds(instructorIds);

  useEffect(() => {
    if ((!coursesLoaded && !coursesError) || requestedCourseIds.length === 0) return;
    logger.debug('Creator instructor course lookup', {
      requestedCourseIds,
      lookupFailed: coursesError,
      courses: requestedCourseIds.map(uuid => ({
        uuid,
        course: courseMap[uuid] ?? null,
        status: courseMap[uuid] ? 'found' : coursesError ? 'lookup-failed' : 'not-returned',
      })),
    });
  }, [requestedCourseIds, courseMap, coursesLoaded, coursesError]);

  const instructors = useMemo(
    () =>
      groups.map(group => {
        const offerings: InstructorOffering[] = [
          ...group.courseIds.map(uuid => ({
            uuid,
            kind: 'course' as const,
            name: courseMap[uuid]?.name || null,
            creatorShare: courseMap[uuid]?.creator_share_percentage,
            instructorShare: courseMap[uuid]?.instructor_share_percentage,
          })),
          ...group.programIds.map(uuid => ({
            uuid,
            kind: 'program' as const,
            name: programMap[uuid]?.title || null,
          })),
        ];
        return {
          ...group,
          profile: instructorMap[group.uuid],
          name: instructorMap[group.uuid]?.full_name?.trim() || 'Instructor',
          offerings,
        };
      }),
    [groups, instructorMap, courseMap, programMap]
  );

  const queries = [applicationsQuery, programApplicationsQuery];
  const hasError =
    coursesError ||
    queries.some(
      query => query.isError || query.data?.pages.some(page => page.error || page.success === false)
    );
  return {
    instructors,
    instructorIds,
    courseIds,
    programIds,
    courseCount: courseIds.length,
    programCount: programIds.length,
    hasError,
    error: queries.find(query => query.error)?.error,
    hasNextPage: queries.some(query => query.hasNextPage),
    isFetching: queries.some(query => query.isFetching),
    isFetchingNextPage: queries.some(query => query.isFetchingNextPage),
    loadMore: () =>
      Promise.all(
        queries
          .filter(query => query.hasNextPage && !query.isFetching)
          .map(query => query.fetchNextPage())
      ),
    refetch: () => Promise.all([...queries.map(query => query.refetch()), refetchCourses()]),
    isLoading:
      profileLoading ||
      applicationsQuery.isLoading ||
      programApplicationsQuery.isLoading ||
      instructorsLoading ||
      coursesLoading ||
      programsLoading,
    hasProfile: Boolean(creatorUuid),
  };
}
