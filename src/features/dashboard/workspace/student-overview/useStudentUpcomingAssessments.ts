'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getAssignmentSchedulesOptions,
  getQuizSchedulesOptions,
  searchAttemptsOptions,
  searchSubmissionsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { StudentClassEnrollmentSummary } from '@/services/client/types.gen';
import {
  useAssignmentsByIds,
  useClassesByIds,
  useCoursesByIds,
  useInstructorsByIds,
  useOrganisationsByIds,
  useQuizzesByIds,
} from '../../../../../hooks/use-batched-lookups';
import {
  isActiveClassEnrollment,
  resolveClassProvider,
  type StudentOverviewAssessment,
  type StudentOverviewSection,
  uniqueIds,
  useStudentClassEnrollments,
  useStudentCourseEnrollments,
} from './useStudentOverviewData';

const ASSESSMENT_PAGE_SIZE = 1000;
/** Schedules are per-class endpoints; the busiest classes keep the page inside its request budget. */
const MAX_SCHEDULED_CLASSES = 6;

const timeOf = (value?: Date | string) => (value ? new Date(value).getTime() || 0 : 0);
const lastActivity = (enrollment: StudentClassEnrollmentSummary) =>
  Math.max(
    timeOf(enrollment.latest_scheduled_instance_start_time),
    timeOf(enrollment.latest_activity_date)
  );

type ScheduleQueryResult<T> = {
  data?: { data?: T[] };
  isLoading: boolean;
  error: unknown;
};

/** Module-level so useQueries can memoise the combined result between renders. */
function combineSchedules<T>(results: ScheduleQueryResult<T>[]) {
  return {
    schedules: results.flatMap(result => result.data?.data ?? []),
    isLoading: results.some(result => result.isLoading),
    error: results.find(result => result.error)?.error ?? null,
  };
}

const formatAssessmentDueLabel = (value?: Date | string | null) => {
  if (!value) {
    return 'No deadline';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'No deadline';
  }

  return `Due ${new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)}`;
};

/*
 * Schedules, submissions, attempts and class definitions all start from the enrolment
 * rows at once. The card waits only for what decides which rows exist; class, course
 * and provider labels fill in afterwards.
 */
export function useStudentUpcomingAssessments(): StudentOverviewSection<
  StudentOverviewAssessment[]
> {
  const classEnrollmentsQuery = useStudentClassEnrollments();
  const courseEnrollmentsQuery = useStudentCourseEnrollments();
  const classEnrollments = classEnrollmentsQuery.enrollments;
  const courseEnrollments = courseEnrollmentsQuery.enrollments;

  const classIds = useMemo(
    () =>
      uniqueIds(
        classEnrollments
          .filter(enrollment => isActiveClassEnrollment(enrollment.latest_enrollment_status))
          .sort((a, b) => lastActivity(b) - lastActivity(a))
          .map(enrollment => enrollment.class_definition_uuid)
      ).slice(0, MAX_SCHEDULED_CLASSES),
    [classEnrollments]
  );

  const classTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const enrollment of classEnrollments) {
      if (enrollment.class_title) map.set(enrollment.class_definition_uuid, enrollment.class_title);
    }
    return map;
  }, [classEnrollments]);

  const assignmentSchedulesQuery = useQueries({
    queries: classIds.slice(0, MAX_SCHEDULED_CLASSES).map(classUuid => ({
      ...getAssignmentSchedulesOptions({ path: { classUuid } }),
      staleTime: STALE_TIMES.live,
      refetchOnWindowFocus: false,
    })),
    combine: combineSchedules,
  });

  const quizSchedulesQuery = useQueries({
    queries: classIds.slice(0, MAX_SCHEDULED_CLASSES).map(classUuid => ({
      ...getQuizSchedulesOptions({ path: { classUuid } }),
      staleTime: STALE_TIMES.live,
      refetchOnWindowFocus: false,
    })),
    combine: combineSchedules,
  });

  const assignmentSchedules = assignmentSchedulesQuery.schedules;
  const quizSchedules = quizSchedulesQuery.schedules;

  const enrollmentIds = useMemo(
    () =>
      uniqueIds([
        ...classEnrollments.map(enrollment => enrollment.latest_enrollment_uuid),
        ...courseEnrollments.map(enrollment => enrollment.enrollment_uuid),
      ]),
    [classEnrollments, courseEnrollments]
  );
  // Wait for both enrolment lists so the id set (and query key) is final: one request each.
  const enrollmentIdsReady =
    enrollmentIds.length > 0 && !classEnrollmentsQuery.isLoading && !courseEnrollmentsQuery.isLoading;

  const submissionsQuery = useQuery({
    ...searchSubmissionsOptions({
      query: {
        searchParams: { enrollment_uuid_in: enrollmentIds.join(',') },
        pageable: { page: 0, size: ASSESSMENT_PAGE_SIZE },
      },
    }),
    enabled: enrollmentIdsReady,
    staleTime: STALE_TIMES.live,
    refetchOnWindowFocus: false,
  });

  const attemptsQuery = useQuery({
    ...searchAttemptsOptions({
      query: {
        searchParams: { enrollment_uuid_in: enrollmentIds.join(',') },
        pageable: { page: 0, size: ASSESSMENT_PAGE_SIZE },
      },
    }),
    enabled: enrollmentIdsReady,
    staleTime: STALE_TIMES.live,
    refetchOnWindowFocus: false,
  });

  const assignmentIds = useMemo(
    () => uniqueIds(assignmentSchedules.map(schedule => schedule.assignment_uuid)),
    [assignmentSchedules]
  );
  const quizIds = useMemo(
    () => uniqueIds(quizSchedules.map(schedule => schedule.quiz_uuid)),
    [quizSchedules]
  );
  const { assignmentMap, isLoading: isLoadingAssignments } = useAssignmentsByIds(assignmentIds);
  const { quizMap, isLoading: isLoadingQuizzes } = useQuizzesByIds(quizIds);

  const { classMap } = useClassesByIds(classIds);
  const classCourseIds = useMemo(
    () => uniqueIds(classIds.map(classUuid => classMap[classUuid]?.course_uuid)),
    [classIds, classMap]
  );
  const instructorIds = useMemo(
    () =>
      uniqueIds(classIds.map(classUuid => classMap[classUuid]?.default_instructor_uuid)),
    [classIds, classMap]
  );
  const organisationIds = useMemo(
    () => uniqueIds(classIds.map(classUuid => classMap[classUuid]?.organisation_uuid)),
    [classIds, classMap]
  );
  const { courseMap } = useCoursesByIds(classCourseIds);
  const { instructorMap } = useInstructorsByIds(instructorIds);
  const { organisationMap } = useOrganisationsByIds(organisationIds);

  const data = useMemo<StudentOverviewAssessment[]>(() => {
    const submitted = new Set(
      uniqueIds((submissionsQuery.data?.data?.content ?? []).map(row => row.assignment_uuid))
    );
    const attempted = new Set(
      uniqueIds((attemptsQuery.data?.data?.content ?? []).map(row => row.quiz_uuid))
    );
    const rows: Array<StudentOverviewAssessment & { sortValue: number }> = [];

    const describeClass = (classUuid: string, fallbackTitle: string) => {
      const classDefinition = classUuid ? classMap[classUuid] : undefined;
      const courseUuid = classDefinition?.course_uuid;
      return {
        provider: resolveClassProvider(classDefinition, instructorMap, organisationMap),
        classTitle: classDefinition?.title ?? classTitleById.get(classUuid) ?? fallbackTitle,
        courseTitle: (courseUuid ? courseMap[courseUuid]?.name : undefined) ?? null,
      };
    };

    for (const schedule of assignmentSchedules) {
      const assignmentUuid = schedule.assignment_uuid;
      const assignment = assignmentUuid ? assignmentMap[assignmentUuid] : undefined;
      if (!assignmentUuid || submitted.has(assignmentUuid) || !assignment) {
        continue;
      }

      const classUuid = schedule.class_definition_uuid ?? '';
      const dueDate = schedule.due_at ?? assignment.due_date ?? null;
      rows.push({
        id: `assignment-${assignmentUuid}-${schedule.uuid ?? classUuid}`,
        kind: 'assignment',
        title: assignment.title,
        ...describeClass(classUuid, 'Class assignment'),
        dueLabel: formatAssessmentDueLabel(dueDate),
        href: `/dashboard/student/assignment/${assignmentUuid}`,
        badgeLabel: 'Assignment',
        sortValue: dueDate ? new Date(dueDate).getTime() : Number.MAX_SAFE_INTEGER,
      });
    }

    for (const schedule of quizSchedules) {
      const quizUuid = schedule.quiz_uuid;
      const quiz = quizUuid ? quizMap[quizUuid] : undefined;
      if (!quizUuid || attempted.has(quizUuid) || !quiz) {
        continue;
      }

      const classUuid = schedule.class_definition_uuid ?? '';
      const dueDate = schedule.due_at ?? null;
      rows.push({
        id: `quiz-${quizUuid}-${schedule.uuid ?? classUuid}`,
        kind: 'quiz',
        title: quiz.title,
        ...describeClass(classUuid, 'Class quiz'),
        dueLabel: formatAssessmentDueLabel(dueDate),
        href: `/dashboard/student/assignment/quiz/${quizUuid}`,
        badgeLabel: 'Quiz',
        sortValue: dueDate ? new Date(dueDate).getTime() : Number.MAX_SAFE_INTEGER,
      });
    }

    return rows
      .sort((a, b) => a.sortValue - b.sortValue)
      .map(({ sortValue: _sortValue, ...assessment }) => assessment);
  }, [
    assignmentMap,
    assignmentSchedules,
    attemptsQuery.data,
    classMap,
    classTitleById,
    courseMap,
    instructorMap,
    organisationMap,
    quizMap,
    quizSchedules,
    submissionsQuery.data,
  ]);

  return {
    data,
    isLoading:
      classEnrollmentsQuery.isLoading ||
      courseEnrollmentsQuery.isLoading ||
      assignmentSchedulesQuery.isLoading ||
      quizSchedulesQuery.isLoading ||
      isLoadingAssignments ||
      isLoadingQuizzes ||
      submissionsQuery.isLoading ||
      attemptsQuery.isLoading,
    error: classEnrollmentsQuery.error,
    refetch: () => {
      classEnrollmentsQuery.refetch();
    },
  };
}
