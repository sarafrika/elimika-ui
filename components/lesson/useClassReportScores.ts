'use client';

import { skipToken, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getAssessmentSchedulesOptions,
  getClassDefinitionOptions,
  getClassDefinitionQueryKey,
  getCourseEnrollmentsInfiniteOptions,
  getCourseEnrollmentsInfiniteQueryKey,
  getGradeBandsOptions,
  getGradeBandsQueryKey,
  getLessonsForCoursesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassReport } from '@/services/client/types.gen';
import { classReportTasks, summarizeClassReportAssessments } from './class-report-scores';
import { useLessonTaskGrades } from './useLessonTaskGrades';
import { hasApiError, nextWorkbookPage, WORKBOOK_PAGE_SIZE } from './workbook-data';

/** Batch grades across lessons and students rather than mounting a score hook per cell. */
export function useClassReportScores(classId: string, report?: ClassReport) {
  const enabled = Boolean(classId && report?.sessions?.length && report.live !== false);
  const definition = useQuery({
    ...(classId
      ? getClassDefinitionOptions({ path: { uuid: classId } })
      : { queryKey: getClassDefinitionQueryKey({ path: { uuid: '' } }), queryFn: skipToken }),
    enabled,
    staleTime: STALE_TIMES.entity,
  });
  const courseId = hasApiError(definition.data)
    ? undefined
    : definition.data?.data?.class_definition?.course_uuid;
  const lessons = useQuery({
    ...getLessonsForCoursesOptions({ query: { course_uuids: courseId ? [courseId] : [] } }),
    enabled: enabled && Boolean(courseId),
    staleTime: STALE_TIMES.entity,
  });
  const schedules = useQuery({
    ...getAssessmentSchedulesOptions({ query: { class_uuids: classId ? [classId] : [] } }),
    enabled,
    staleTime: STALE_TIMES.live,
  });
  const bands = useQuery({
    ...(courseId
      ? getGradeBandsOptions({ path: { courseUuid: courseId } })
      : { queryKey: getGradeBandsQueryKey({ path: { courseUuid: '' } }), queryFn: skipToken }),
    enabled: enabled && Boolean(courseId),
    staleTime: STALE_TIMES.reference,
  });
  const tasksBySession = useMemo(
    () =>
      classReportTasks(
        report ?? {},
        hasApiError(lessons.data) ? [] : (lessons.data?.data ?? []),
        hasApiError(schedules.data) ? [] : (schedules.data?.data?.assignment_schedules ?? []),
        hasApiError(schedules.data) ? [] : (schedules.data?.data?.quiz_schedules ?? [])
      ),
    [report, lessons.data, schedules.data]
  );
  const tasks = useMemo(
    () => [...new Map([...tasksBySession.values()].flat().map(task => [task.id, task])).values()],
    [tasksBySession]
  );
  const studentIds = useMemo(
    () =>
      new Set(
        (report?.students ?? []).flatMap(student =>
          student.student_uuid ? [student.student_uuid] : []
        )
      ),
    [report?.students]
  );
  // The course roster is paginated; stop as soon as the report's learners are resolved.
  const enrollments = useInfiniteQuery({
    ...(courseId
      ? getCourseEnrollmentsInfiniteOptions({
          path: { courseUuid: courseId },
          query: { pageable: { size: WORKBOOK_PAGE_SIZE } },
        })
      : {
          queryKey: getCourseEnrollmentsInfiniteQueryKey({
            path: { courseUuid: '' },
            query: { pageable: { size: WORKBOOK_PAGE_SIZE } },
          }),
          queryFn: skipToken,
        }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const found = new Set(
        pages.flatMap(page =>
          hasApiError(page) ? [] : (page.data?.content ?? []).map(entry => entry.student_uuid)
        )
      );
      if ([...studentIds].every(id => found.has(id))) return undefined;
      return nextWorkbookPage(lastPage, pages);
    },
    enabled: enabled && Boolean(courseId && tasks.length && studentIds.size),
    staleTime: STALE_TIMES.live,
  });
  const enrollmentError = enrollments.isError || Boolean(enrollments.data?.pages.some(hasApiError));
  const { hasNextPage, isFetching, fetchNextPage } = enrollments;
  useEffect(() => {
    if (enabled && hasNextPage && !isFetching && !enrollmentError) void fetchNextPage();
  }, [enabled, hasNextPage, isFetching, enrollmentError, fetchNextPage]);
  const roster = useMemo(
    () =>
      enrollments.data?.pages.flatMap(page =>
        hasApiError(page)
          ? []
          : (page.data?.content ?? []).filter(
              entry => entry.course_uuid === courseId && studentIds.has(entry.student_uuid)
            )
      ) ?? [],
    [enrollments.data, courseId, studentIds]
  );
  const enrollmentIds = useMemo(
    () => roster.flatMap(entry => (entry.uuid ? [entry.uuid] : [])),
    [roster]
  );
  // Wait for the roster pages so the enrollment filter does not grow one request at a time.
  const grades = useLessonTaskGrades(tasks, hasNextPage && !enrollmentError ? [] : enrollmentIds);
  const gradeBands = useMemo(
    () => (hasApiError(bands.data) ? [] : (bands.data?.data ?? [])),
    [bands.data]
  );
  const summary = useMemo(
    () =>
      summarizeClassReportAssessments({
        report: report ?? {},
        tasks: tasksBySession,
        enrollments: roster,
        submissions: grades.submissionMap,
        attempts: grades.attemptMap,
        bands: gradeBands,
      }),
    [report, tasksBySession, roster, grades.submissionMap, grades.attemptMap, gradeBands]
  );
  return {
    summary,
    isLoading:
      enabled &&
      (definition.isLoading ||
        lessons.isLoading ||
        schedules.isLoading ||
        bands.isLoading ||
        enrollments.isLoading ||
        Boolean(hasNextPage && !enrollmentError) ||
        grades.assignmentLoading ||
        grades.quizLoading),
    isError:
      enabled &&
      (definition.isError ||
        hasApiError(definition.data) ||
        lessons.isError ||
        hasApiError(lessons.data) ||
        schedules.isError ||
        hasApiError(schedules.data) ||
        bands.isError ||
        hasApiError(bands.data) ||
        enrollmentError ||
        grades.assignmentError ||
        grades.quizError),
    refetch: () => {
      if (!enabled) return;
      void definition.refetch();
      void schedules.refetch();
      if (courseId) {
        void lessons.refetch();
        void bands.refetch();
      }
      if (courseId && tasks.length && studentIds.size) void enrollments.refetch();
      grades.refetch();
    },
  };
}
