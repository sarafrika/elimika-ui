'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useClassAssessmentSchedules } from '@/hooks/use-class-assessment-schedules';
import { STALE_TIMES } from '@/lib/query-client';
import {
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
import { useStudentCourseOverview } from '../../../../../hooks/use-student-course-overview';
import {
  isActiveClassEnrollment,
  isActiveOverviewItem,
  resolveClassProvider,
  type StudentOverviewAssessment,
  type StudentOverviewSection,
  uniqueIds,
  useStudentClassEnrollments,
  useStudentCourseEnrollments,
} from './useStudentOverviewData';

const ASSESSMENT_PAGE_SIZE = 1000;
/** Caps the classes whose schedules load, so the busiest classes stay inside the request budget. */
const MAX_SCHEDULED_CLASSES = 6;

const timeOf = (value?: Date | string) => (value ? new Date(value).getTime() || 0 : 0);
const lastActivity = (enrollment: StudentClassEnrollmentSummary) =>
  Math.max(
    timeOf(enrollment.latest_scheduled_instance_start_time),
    timeOf(enrollment.latest_activity_date)
  );

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

// The course-overview composite names the classes with unsubmitted work, so only their
// schedules load; the enrolment lists and entity lookups run only when it is unavailable.
export function useStudentUpcomingAssessments(): StudentOverviewSection<
  StudentOverviewAssessment[]
> {
  const overview = useStudentCourseOverview();
  const legacy = overview.needsFallback;
  const classEnrollmentsQuery = useStudentClassEnrollments(legacy);
  const courseEnrollmentsQuery = useStudentCourseEnrollments(legacy);
  const classEnrollments = classEnrollmentsQuery.enrollments;
  const courseEnrollments = courseEnrollmentsQuery.enrollments;

  const overviewByClass = useMemo(
    () =>
      new Map(
        overview.items
          .filter(isActiveOverviewItem)
          .map(item => [item.class_definition_uuid, item] as const)
      ),
    [overview.items]
  );

  const classIds = useMemo(
    () =>
      legacy
        ? uniqueIds(
            classEnrollments
              .filter(enrollment => isActiveClassEnrollment(enrollment.latest_enrollment_status))
              .sort((a, b) => lastActivity(b) - lastActivity(a))
              .map(enrollment => enrollment.class_definition_uuid)
          ).slice(0, MAX_SCHEDULED_CLASSES)
        : [],
    [classEnrollments, legacy]
  );

  // Overview rows arrive most recently active first, so the slice keeps the busiest classes.
  const pendingAssignmentClassIds = useMemo(
    () =>
      legacy
        ? classIds
        : Array.from(overviewByClass.values())
            .filter(item => (item.pending_assignment_count ?? 0) > 0)
            .map(item => item.class_definition_uuid)
            .slice(0, MAX_SCHEDULED_CLASSES),
    [classIds, legacy, overviewByClass]
  );
  const pendingQuizClassIds = useMemo(
    () =>
      legacy
        ? classIds
        : Array.from(overviewByClass.values())
            .filter(item => (item.pending_quiz_count ?? 0) > 0)
            .map(item => item.class_definition_uuid)
            .slice(0, MAX_SCHEDULED_CLASSES),
    [classIds, legacy, overviewByClass]
  );

  const classTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const enrollment of classEnrollments) {
      if (enrollment.class_title) map.set(enrollment.class_definition_uuid, enrollment.class_title);
    }
    return map;
  }, [classEnrollments]);

  // One batched assessment-schedules call covers both pending sets.
  const scheduleClassIds = useMemo(
    () =>
      uniqueIds([
        ...pendingAssignmentClassIds.slice(0, MAX_SCHEDULED_CLASSES),
        ...pendingQuizClassIds.slice(0, MAX_SCHEDULED_CLASSES),
      ]),
    [pendingAssignmentClassIds, pendingQuizClassIds]
  );
  const schedulesQuery = useClassAssessmentSchedules(scheduleClassIds);

  const assignmentSchedules = useMemo(() => {
    const wanted = new Set(pendingAssignmentClassIds.slice(0, MAX_SCHEDULED_CLASSES));
    return schedulesQuery.assignmentSchedules.filter(schedule =>
      wanted.has(schedule.class_definition_uuid ?? '')
    );
  }, [pendingAssignmentClassIds, schedulesQuery.assignmentSchedules]);
  const quizSchedules = useMemo(() => {
    const wanted = new Set(pendingQuizClassIds.slice(0, MAX_SCHEDULED_CLASSES));
    return schedulesQuery.quizSchedules.filter(schedule =>
      wanted.has(schedule.class_definition_uuid ?? '')
    );
  }, [pendingQuizClassIds, schedulesQuery.quizSchedules]);

  const enrollmentIds = useMemo(
    () =>
      legacy
        ? uniqueIds([
            ...classEnrollments.map(enrollment => enrollment.latest_enrollment_uuid),
            ...courseEnrollments.map(enrollment => enrollment.enrollment_uuid),
          ])
        : uniqueIds(
            overview.items.flatMap(item => [
              item.latest_enrollment_uuid,
              item.course_enrollment_uuid,
            ])
          ),
    [classEnrollments, courseEnrollments, legacy, overview.items]
  );
  const hasPendingWork = pendingAssignmentClassIds.length + pendingQuizClassIds.length > 0;
  // Wait for the enrolment rows so the id set (and query key) is final: one request each.
  const enrollmentIdsReady =
    enrollmentIds.length > 0 &&
    hasPendingWork &&
    (legacy
      ? !classEnrollmentsQuery.isLoading && !courseEnrollmentsQuery.isLoading
      : overview.isReady);

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

  // Legacy-only lookups: overview rows already carry class, course and instructor names.
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
    () =>
      legacy
        ? uniqueIds(classIds.map(classUuid => classMap[classUuid]?.organisation_uuid))
        : uniqueIds(
            [...pendingAssignmentClassIds, ...pendingQuizClassIds].map(
              classUuid => overviewByClass.get(classUuid)?.organisation_uuid
            )
          ),
    [
      classIds,
      classMap,
      legacy,
      overviewByClass,
      pendingAssignmentClassIds,
      pendingQuizClassIds,
    ]
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
      const overviewItem = legacy ? undefined : overviewByClass.get(classUuid);
      if (overviewItem) {
        const organisationUuid = overviewItem.organisation_uuid;
        return {
          provider:
            (organisationUuid ? organisationMap[organisationUuid]?.name : undefined) ??
            overviewItem.instructor_name ??
            (organisationUuid ? 'Organisation' : 'Class provider'),
          classTitle: overviewItem.class_title ?? fallbackTitle,
          courseTitle: overviewItem.course_name ?? null,
        };
      }

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
    legacy,
    organisationMap,
    overviewByClass,
    quizMap,
    quizSchedules,
    submissionsQuery.data,
  ]);

  return {
    data,
    isLoading:
      overview.isLoading ||
      classEnrollmentsQuery.isLoading ||
      (legacy && courseEnrollmentsQuery.isLoading) ||
      schedulesQuery.isLoading ||
      isLoadingAssignments ||
      isLoadingQuizzes ||
      submissionsQuery.isLoading ||
      attemptsQuery.isLoading,
    error: legacy ? classEnrollmentsQuery.error : null,
    refetch: () => {
      if (legacy) classEnrollmentsQuery.refetch();
      else overview.refetch();
    },
  };
}
