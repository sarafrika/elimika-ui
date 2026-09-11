'use client';

import { useCourseCreator } from '@/context/course-creator-context';
import { useCoursesByIds, useInstructorsByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import { searchTrainingApplicationsInfiniteOptions } from '@/services/client/@tanstack/react-query.gen';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { groupInstructorCourses } from './instructor-data';

const PAGE_SIZE = 50;

export function useCreatorInstructors(instructorUuid?: string) {
  const { profile, isLoading: profileLoading } = useCourseCreator();
  const creatorUuid = profile?.uuid;
  const applicationsQuery = useInfiniteQuery({
    ...searchTrainingApplicationsInfiniteOptions({
      query: {
        searchParams: {
          course_creator_uuid: creatorUuid,
          applicant_type: 'instructor',
          status: 'approved',
          ...(instructorUuid ? { applicant_uuid_eq: instructorUuid } : {}),
        },
        pageable: { page: 0, size: PAGE_SIZE },
      },
    }),
    enabled: Boolean(creatorUuid),
    staleTime: STALE_TIMES.live,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const metadata = lastPage.data?.metadata;
      const nextPage = (metadata?.pageNumber ?? pages.length - 1) + 1;
      const hasNext =
        metadata?.hasNext ??
        (metadata?.totalPages != null
          ? nextPage < metadata.totalPages
          : (lastPage.data?.content?.length ?? 0) === PAGE_SIZE);
      return hasNext ? { query: { pageable: { page: nextPage, size: PAGE_SIZE } } } : undefined;
    },
  });
  const groups = useMemo(
    () =>
      groupInstructorCourses(
        creatorUuid
          ? (applicationsQuery.data?.pages.flatMap(page => page.data?.content ?? []) ?? [])
          : [],
        instructorUuid
      ),
    [applicationsQuery.data, creatorUuid, instructorUuid]
  );
  const instructorIds = useMemo(() => groups.map(group => group.uuid), [groups]);
  const courseIds = useMemo(() => [...new Set(groups.flatMap(group => group.courseIds))], [groups]);
  const { instructorMap, isLoading: instructorsLoading } = useInstructorsByIds(instructorIds);
  const { courseMap, isLoading: coursesLoading } = useCoursesByIds(courseIds);
  const instructors = useMemo(
    () =>
      groups.map(group => ({
        ...group,
        profile: instructorMap[group.uuid],
        name: instructorMap[group.uuid]?.full_name?.trim() || 'Instructor',
        courses: group.courseIds.map(uuid => ({
          uuid,
          name: courseMap[uuid]?.name || 'Course title unavailable',
          creator_share_percentage: courseMap[uuid]?.creator_share_percentage,
          instructor_share_percentage: courseMap[uuid]?.instructor_share_percentage,
        })),
      })),
    [groups, instructorMap, courseMap]
  );

  return {
    instructors,
    courseCount: courseIds.length,
    applicationsQuery,
    isLoading:
      profileLoading || applicationsQuery.isLoading || instructorsLoading || coursesLoading,
    hasProfile: Boolean(creatorUuid),
  };
}
