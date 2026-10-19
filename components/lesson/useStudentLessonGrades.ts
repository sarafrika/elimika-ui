'use client';

import { skipToken, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useUserProfile } from '@/context/profile-context';
import { useStudent } from '@/context/student-context';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getCourseEnrollmentsForStudentInfiniteOptions,
  getCourseEnrollmentsForStudentInfiniteQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import type { LessonGradingTask } from './LessonGradingPanel';
import { useLessonTaskGrades } from './useLessonTaskGrades';
import { hasApiError, nextWorkbookPage, WORKBOOK_PAGE_SIZE } from './workbook-data';

export function useStudentLessonGrades(
  courseId: string,
  tasks: LessonGradingTask[],
  enabled: boolean
) {
  const student = useStudent();
  const profile = useUserProfile();
  const studentId = enabled ? student?.uuid : undefined;
  const enrollments = useInfiniteQuery({
    ...(studentId
      ? getCourseEnrollmentsForStudentInfiniteOptions({
          path: { studentUuid: studentId },
          query: { pageable: { size: WORKBOOK_PAGE_SIZE } },
        })
      : {
          queryKey: getCourseEnrollmentsForStudentInfiniteQueryKey({
            path: { studentUuid: '' },
            query: { pageable: { size: WORKBOOK_PAGE_SIZE } },
          }),
          queryFn: skipToken,
        }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: Boolean(studentId && courseId),
    staleTime: STALE_TIMES.live,
  });
  // Grading records use the course enrollment, rather than the session's attendance id.
  const enrollmentId = useMemo(
    () =>
      enrollments.data?.pages
        .flatMap(page => (hasApiError(page) ? [] : (page.data?.content ?? [])))
        .find(item => item.course_uuid === courseId)?.enrollment_uuid,
    [enrollments.data, courseId]
  );
  const enrollmentError = enrollments.isError || Boolean(enrollments.data?.pages.some(hasApiError));
  const { hasNextPage, isFetching, fetchNextPage } = enrollments;
  // Stop paging once this course is found; never load other students' enrollments.
  useEffect(() => {
    if (
      enabled &&
      studentId &&
      courseId &&
      !enrollmentId &&
      hasNextPage &&
      !isFetching &&
      !enrollmentError
    )
      void fetchNextPage();
  }, [
    enabled,
    studentId,
    courseId,
    enrollmentId,
    hasNextPage,
    isFetching,
    enrollmentError,
    fetchNextPage,
  ]);
  const enrollmentIds = useMemo(
    () => (enabled && enrollmentId && !enrollmentError ? [enrollmentId] : []),
    [enabled, enrollmentId, enrollmentError]
  );
  const grades = useLessonTaskGrades(tasks, enrollmentIds);
  const enrollmentLoading =
    enabled &&
    (Boolean(profile?.isLoading) ||
      enrollments.isLoading ||
      Boolean(!enrollmentId && hasNextPage && !enrollmentError));

  return {
    ...grades,
    enrollmentId,
    assignmentLoading: enrollmentLoading || grades.assignmentLoading,
    quizLoading: enrollmentLoading || grades.quizLoading,
    assignmentError: enrollmentError || grades.assignmentError,
    quizError: enrollmentError || grades.quizError,
    refetch: () => {
      if (studentId && courseId) void enrollments.refetch();
      grades.refetch();
    },
  };
}
