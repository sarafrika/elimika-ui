'use client';

import { useCoursesByIds, useProgramsByIds } from '@/hooks/use-batched-lookups';
import { APPROVAL_QUERY_FRESHNESS, STALE_TIMES } from '@/lib/query-client';
import { ApplicantTypeEnum, type PageMetadata } from '@/services/client';
import {
  searchProgramTrainingApplicationsInfiniteOptions,
  searchTrainingApplicationsInfiniteOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

const PAGE_SIZE = 100;

function nextPage(
  response: {
    error?: unknown;
    success?: boolean;
    data?: { content?: unknown[]; metadata?: PageMetadata };
  },
  pages: unknown[]
) {
  if (response.error || response.success === false) return undefined;
  const { content = [], metadata } = response.data ?? {};
  const hasNext =
    metadata?.hasNext ??
    (metadata?.last !== undefined
      ? !metadata.last
      : metadata?.totalPages !== undefined
        ? pages.length < metadata.totalPages
        : content.length === PAGE_SIZE);
  return content.length > 0 && hasNext ? pages.length : undefined;
}

/** The same approved training catalogue powers the training hub and class creation. */
export function useInstructorApprovedOfferings(instructorUuid?: string) {
  const query = {
    pageable: { page: 0, size: PAGE_SIZE },
    searchParams: {
      applicant_uuid_eq: instructorUuid ?? '',
      applicant_type_eq: ApplicantTypeEnum.INSTRUCTOR,
      status_eq: 'approved',
    },
  };
  const coursesQuery = useInfiniteQuery({
    ...searchTrainingApplicationsInfiniteOptions({ query }),
    enabled: Boolean(instructorUuid),
    initialPageParam: 0,
    getNextPageParam: nextPage,
    staleTime: STALE_TIMES.entity,
    ...APPROVAL_QUERY_FRESHNESS,
  });
  const programsQuery = useInfiniteQuery({
    ...searchProgramTrainingApplicationsInfiniteOptions({ query }),
    enabled: Boolean(instructorUuid),
    initialPageParam: 0,
    getNextPageParam: nextPage,
    staleTime: STALE_TIMES.entity,
    ...APPROVAL_QUERY_FRESHNESS,
  });

  const {
    hasNextPage: moreCourses,
    isFetching: fetchingCourses,
    isError: coursesFailed,
    fetchNextPage: fetchCourses,
  } = coursesQuery;
  const {
    hasNextPage: morePrograms,
    isFetching: fetchingPrograms,
    isError: programsFailed,
    fetchNextPage: fetchPrograms,
  } = programsQuery;
  useEffect(() => {
    if (moreCourses && !fetchingCourses && !coursesFailed) void fetchCourses();
  }, [moreCourses, fetchingCourses, coursesFailed, fetchCourses]);
  useEffect(() => {
    if (morePrograms && !fetchingPrograms && !programsFailed) void fetchPrograms();
  }, [morePrograms, fetchingPrograms, programsFailed, fetchPrograms]);

  const courseApplications = useMemo(
    () =>
      coursesQuery.data?.pages
        .flatMap(page => (page.error || page.success === false ? [] : (page.data?.content ?? [])))
        .filter(
          application =>
            application.status === 'approved' &&
            application.course_uuid &&
            application.applicant_uuid === instructorUuid &&
            application.applicant_type === ApplicantTypeEnum.INSTRUCTOR
        ) ?? [],
    [coursesQuery.data, instructorUuid]
  );
  const programApplications = useMemo(
    () =>
      programsQuery.data?.pages
        .flatMap(page => (page.error || page.success === false ? [] : (page.data?.content ?? [])))
        .filter(
          application =>
            application.status === 'approved' &&
            application.program_uuid &&
            application.applicant_uuid === instructorUuid &&
            application.applicant_type === ApplicantTypeEnum.INSTRUCTOR
        ) ?? [],
    [programsQuery.data, instructorUuid]
  );

  const courseIds = useMemo(
    () => courseApplications.flatMap(app => (app.course_uuid ? [app.course_uuid] : [])),
    [courseApplications]
  );
  const programIds = useMemo(
    () => programApplications.flatMap(app => (app.program_uuid ? [app.program_uuid] : [])),
    [programApplications]
  );
  const { courseMap, isLoading: coursesLoading } = useCoursesByIds(courseIds);
  const { programMap, isLoading: programsLoading } = useProgramsByIds(programIds);

  const approvedCourses = useMemo(
    () =>
      Array.from(
        new Map(
          courseApplications.flatMap(application => {
            const course = application.course_uuid ? courseMap[application.course_uuid] : undefined;
            return course?.uuid && course.admin_approved && course.is_published
              ? [[course.uuid, { ...course, uuid: course.uuid, application }] as const]
              : [];
          })
        ).values()
      ),
    [courseApplications, courseMap]
  );
  const approvedPrograms = useMemo(
    () =>
      Array.from(
        new Map(
          programApplications.flatMap(application => {
            const program = application.program_uuid
              ? programMap[application.program_uuid]
              : undefined;
            return program?.uuid && program.admin_approved && program.published
              ? [[program.uuid, { ...program, uuid: program.uuid, application }] as const]
              : [];
          })
        ).values()
      ),
    [programApplications, programMap]
  );

  return {
    approvedCourses,
    approvedPrograms,
    isLoading:
      Boolean(instructorUuid) &&
      (coursesQuery.isLoading ||
        programsQuery.isLoading ||
        moreCourses ||
        morePrograms ||
        coursesLoading ||
        programsLoading),
    error:
      coursesQuery.error ??
      programsQuery.error ??
      coursesQuery.data?.pages.find(page => page.error || page.success === false) ??
      programsQuery.data?.pages.find(page => page.error || page.success === false),
    refetch: () => {
      void coursesQuery.refetch();
      void programsQuery.refetch();
    },
  };
}
