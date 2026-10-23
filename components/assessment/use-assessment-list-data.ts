'use client';

import { skipToken, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import {
  hasApiError,
  nextWorkbookPage,
  WORKBOOK_PAGE_SIZE,
} from '@/components/lesson/workbook-data';
import {
  useAssignmentsByIds,
  useClassesByIds,
  useInstructorsByIds,
  useQuizzesByIds,
} from '@/hooks/use-batched-lookups';
import { useClassAssessmentSchedules } from '@/hooks/use-class-assessment-schedules';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getClassDefinitionsForInstructorOptions,
  getClassDefinitionsForInstructorQueryKey,
  getStudentCourseOverviewInfiniteOptions,
  getStudentCourseOverviewInfiniteQueryKey,
  searchAttemptsInfiniteOptions,
  searchSubmissionsInfiniteOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import {
  type AssessmentClass,
  type AssessmentRole,
  buildAssessmentRows,
  buildAssessmentResultRows,
} from './assessment-list-data';

function useRemainingPages(
  query: {
    hasNextPage: boolean;
    isFetching: boolean;
    isError: boolean;
    fetchNextPage: () => Promise<unknown>;
  },
  failed: boolean
) {
  const { hasNextPage, isFetching, isError, fetchNextPage } = query;
  useEffect(() => {
    if (hasNextPage && !isFetching && !isError && !failed) void fetchNextPage();
  }, [hasNextPage, isFetching, isError, fetchNextPage, failed]);
}

/** Only role-scoped class lists, batched schedules/templates and paged result searches load. */
export function useAssessmentListData(role: AssessmentRole) {
  const profile = useUserProfile();
  const studentUuid = role === 'student' ? profile?.student?.uuid : undefined;
  const instructorUuid = role === 'instructor' ? profile?.instructor?.uuid : undefined;
  const studentOptions = studentUuid
    ? getStudentCourseOverviewInfiniteOptions({
        path: { studentUuid },
        query: { pageable: { size: WORKBOOK_PAGE_SIZE } },
      })
    : null;
  const studentClasses = useInfiniteQuery({
    ...studentOptions,
    queryKey:
      studentOptions?.queryKey ??
      getStudentCourseOverviewInfiniteQueryKey({
        path: { studentUuid: '' },
        query: { pageable: { size: WORKBOOK_PAGE_SIZE } },
      }),
    queryFn: studentOptions?.queryFn ?? skipToken,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (hasApiError(lastPage)) return undefined;
      return nextWorkbookPage({ data: lastPage.data?.enrollments }, pages);
    },
    enabled: Boolean(studentUuid),
    staleTime: STALE_TIMES.live,
  });
  const studentError =
    studentClasses.isError || Boolean(studentClasses.data?.pages.some(hasApiError));
  useRemainingPages(studentClasses, studentError);

  const instructorOptions = instructorUuid
    ? getClassDefinitionsForInstructorOptions({ path: { instructorUuid } })
    : null;
  const instructorClasses = useQuery({
    ...instructorOptions,
    queryKey:
      instructorOptions?.queryKey ??
      getClassDefinitionsForInstructorQueryKey({ path: { instructorUuid: '' } }),
    queryFn: instructorOptions?.queryFn ?? skipToken,
    enabled: Boolean(instructorUuid),
    staleTime: STALE_TIMES.live,
  });
  const instructorError = instructorClasses.isError || hasApiError(instructorClasses.data);
  const instructorClassIds = useMemo(
    () =>
      hasApiError(instructorClasses.data)
        ? []
        : (instructorClasses.data?.data ?? []).flatMap(item =>
            item.class_definition?.uuid ? [item.class_definition.uuid] : []
          ),
    [instructorClasses.data]
  );
  const classLookup = useClassesByIds(instructorClassIds);
  const classes = useMemo<AssessmentClass[]>(() => {
    if (role === 'instructor' && hasApiError(instructorClasses.data)) return [];
    const list: AssessmentClass[] =
      role === 'student'
        ? (studentClasses.data?.pages ?? []).flatMap(page =>
            hasApiError(page)
              ? []
              : (page.data?.enrollments?.content ?? []).map(item => ({
                  uuid: item.class_definition_uuid,
                  title: item.class_title || 'Class',
                  courseUuid: item.course_uuid || '',
                  courseTitle: item.course_name || 'Course',
                  instructorUuid: item.instructor_uuid || '',
                  instructorName: item.instructor_name || 'Instructor',
                  enrollmentUuids: [
                    item.course_enrollment_uuid,
                    item.latest_enrollment_uuid,
                  ].filter((id): id is string => Boolean(id)),
                  learners: null,
                }))
          )
        : (instructorClasses.data?.data ?? []).flatMap(item => {
            const cls = item.class_definition;
            if (!cls?.uuid) return [];
            const summary = classLookup.classMap[cls.uuid];
            return [
              {
                uuid: cls.uuid,
                title: cls.title || summary?.title || 'Class',
                courseUuid: cls.course_uuid || '',
                courseTitle: summary?.course_title || summary?.program_title || 'Course',
                instructorUuid: cls.default_instructor_uuid || instructorUuid || '',
                instructorName:
                  summary?.instructor?.display_name || profile?.full_name || 'Instructor',
                enrollmentUuids: [],
                learners: summary?.enrolled_count == null ? null : Number(summary.enrolled_count),
              },
            ];
          });
    return [...new Map(list.map(item => [item.uuid, item])).values()];
  }, [
    role,
    studentClasses.data,
    instructorClasses.data,
    classLookup.classMap,
    instructorUuid,
    profile?.full_name,
  ]);
  const classesLoading =
    role === 'student'
      ? studentClasses.isLoading || Boolean(studentClasses.hasNextPage && !studentError)
      : instructorClasses.isLoading || classLookup.isLoading;
  const classIds = useMemo(
    () => (classesLoading ? [] : classes.map(item => item.uuid)),
    [classes, classesLoading]
  );
  const schedules = useClassAssessmentSchedules(classIds);
  const assignmentIds = useMemo(
    () =>
      [
        ...new Set(
          schedules.assignmentSchedules.flatMap(item =>
            item.assignment_uuid ? [item.assignment_uuid] : []
          )
        ),
      ].sort(),
    [schedules.assignmentSchedules]
  );
  const quizIds = useMemo(
    () =>
      [
        ...new Set(
          schedules.quizSchedules.flatMap(item => (item.quiz_uuid ? [item.quiz_uuid] : []))
        ),
      ].sort(),
    [schedules.quizSchedules]
  );
  const assignments = useAssignmentsByIds(assignmentIds);
  const quizzes = useQuizzesByIds(quizIds);
  const instructorIds = useMemo(
    () =>
      [
        ...new Set(
          [...schedules.assignmentSchedules, ...schedules.quizSchedules].flatMap(item =>
            item.instructor_uuid ? [item.instructor_uuid] : []
          )
        ),
      ].filter(
        id => !classes.some(cls => cls.instructorUuid === id && cls.instructorName !== 'Instructor')
      ),
    [classes, schedules.assignmentSchedules, schedules.quizSchedules]
  );
  const instructors = useInstructorsByIds(instructorIds);
  const enrollmentFilter = useMemo(
    () => [...new Set(classes.flatMap(item => item.enrollmentUuids))].sort().join(','),
    [classes]
  );
  const submissionFilter = assignmentIds.join(',');
  const attemptFilter = quizIds.join(',');
  const canLoadResults = !classesLoading && (role === 'instructor' || Boolean(enrollmentFilter));
  const submissions = useInfiniteQuery({
    ...searchSubmissionsInfiniteOptions({
      query: {
        searchParams: {
          assignmentUuid_in: submissionFilter,
          ...(role === 'student' ? { enrollmentUuid_in: enrollmentFilter } : {}),
        },
        pageable: { size: WORKBOOK_PAGE_SIZE },
      },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: canLoadResults && Boolean(submissionFilter),
    staleTime: STALE_TIMES.live,
  });
  const attempts = useInfiniteQuery({
    ...searchAttemptsInfiniteOptions({
      query: {
        searchParams: {
          quizUuid_in: attemptFilter,
          ...(role === 'student' ? { enrollmentUuid_in: enrollmentFilter } : {}),
        },
        pageable: { size: WORKBOOK_PAGE_SIZE },
      },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: canLoadResults && Boolean(attemptFilter),
    staleTime: STALE_TIMES.live,
  });
  const submissionError = submissions.isError || Boolean(submissions.data?.pages.some(hasApiError));
  const attemptError = attempts.isError || Boolean(attempts.data?.pages.some(hasApiError));
  useRemainingPages(submissions, submissionError);
  useRemainingPages(attempts, attemptError);
  const rows = useMemo(
    () =>
      buildAssessmentRows({
        role,
        classes,
        assignments: assignments.assignmentMap,
        quizzes: quizzes.quizMap,
        assignmentSchedules: schedules.assignmentSchedules,
        quizSchedules: schedules.quizSchedules,
        submissions:
          submissions.data?.pages.flatMap(page =>
            hasApiError(page) ? [] : (page.data?.content ?? [])
          ) ?? [],
        attempts:
          attempts.data?.pages.flatMap(page =>
            hasApiError(page) ? [] : (page.data?.content ?? [])
          ) ?? [],
        instructorNames: Object.fromEntries(
          Object.entries(instructors.instructorMap).map(([id, item]) => [
            id,
            item.full_name || 'Instructor',
          ])
        ),
      }),
    [
      role,
      classes,
      assignments.assignmentMap,
      quizzes.quizMap,
      schedules.assignmentSchedules,
      schedules.quizSchedules,
      submissions.data,
      attempts.data,
      instructors.instructorMap,
    ]
  );
  const resultRows = useMemo(
    () =>
      buildAssessmentResultRows(
        rows,
        submissions.data?.pages.flatMap(page =>
          hasApiError(page) ? [] : (page.data?.content ?? [])
        ) ?? [],
        attempts.data?.pages.flatMap(page =>
          hasApiError(page) ? [] : (page.data?.content ?? [])
        ) ?? [],
        role
      ),
    [rows, submissions.data, attempts.data, role]
  );
  return {
    rows,
    resultRows,
    isLoading:
      Boolean(profile?.isLoading) ||
      classesLoading ||
      schedules.isLoading ||
      assignments.isLoading ||
      quizzes.isLoading ||
      instructors.isLoading ||
      submissions.isLoading ||
      attempts.isLoading ||
      Boolean(submissions.hasNextPage && !submissionError) ||
      Boolean(attempts.hasNextPage && !attemptError),
    isError:
      (role === 'student' ? studentError : instructorError || classLookup.isError) ||
      schedules.isError ||
      assignments.isError ||
      quizzes.isError ||
      instructors.isError ||
      submissionError ||
      attemptError,
    retry: () => {
      if (studentUuid) void studentClasses.refetch();
      if (instructorUuid) void instructorClasses.refetch();
      void classLookup.refetch();
      void schedules.refetch();
      void assignments.refetch();
      void quizzes.refetch();
      void instructors.refetch();
      if (canLoadResults && submissionFilter) void submissions.refetch();
      if (canLoadResults && attemptFilter) void attempts.refetch();
    },
  };
}
