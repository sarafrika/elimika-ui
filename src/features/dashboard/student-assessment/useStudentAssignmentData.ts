'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAssignmentsByIds } from '@/hooks/use-batched-lookups';
import { useClassAssessmentSchedules } from '@/hooks/use-class-assessment-schedules';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import { useStudentCourseOverview } from '@/hooks/use-student-course-overview';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getAssignmentAttachmentsOptions,
  searchSubmissionsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Assignment,
  AssignmentAttachment,
  AssignmentSubmission,
  ClassAssignmentSchedule,
} from '@/services/client/types.gen';
import { useUserProfile } from '../../profile/context/profile-context';

type StudentClassDefinitionRow = ReturnType<
  typeof useStudentClassDefinitions
>['classDefinitions'][number];

type ResolvedClassDetails = {
  class_definition?: { title?: string; uuid?: string };
  course_name?: string;
  name?: string;
  title?: string;
  uuid?: string;
};

export type StudentAssignmentFilterTab = 'all' | 'pending' | 'submitted' | 'graded' | 'returned';

export type StudentAssignmentClassMeta = {
  classUuid: string;
  classTitle: string;
  courseTitle: string;
  courseUuid: string;
  studentUuid?: string;
  enrollmentUuid?: string;
  courseEnrollmentUuid?: string;
  classEnrollmentUuid?: string;
};

export type StudentAssignmentRow = {
  assignment: Assignment;
  attachments: AssignmentAttachment[];
  classMeta: StudentAssignmentClassMeta;
  latestSubmission: AssignmentSubmission | null;
  schedule: ClassAssignmentSchedule;
  submissions: AssignmentSubmission[];
};

type StudentAssignmentClassItem = {
  classTitle: string;
  classUuid: string;
  courseTitle: string;
  courseUuid: string;
  studentUuid?: string;
  enrollmentUuid?: string;
  courseEnrollmentUuid?: string;
  classEnrollmentUuid?: string;
};

function getClassTitle(classDetails?: ResolvedClassDetails) {
  return (
    classDetails?.class_definition?.title ||
    classDetails?.title ||
    classDetails?.name ||
    'Untitled class'
  );
}

export function getDueSummary(value?: string | Date | null) {
  if (!value) {
    return {
      badgeClassName: 'border-border/70 bg-muted/40 text-muted-foreground',
      label: 'Self paced',
      tone: 'neutral' as const,
    };
  }

  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) {
    return {
      badgeClassName: 'border-border/70 bg-muted/40 text-muted-foreground',
      label: 'No deadline',
      tone: 'neutral' as const,
    };
  }

  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      badgeClassName: 'border-destructive/30 bg-destructive/10 text-destructive',
      label: 'Overdue',
      tone: 'danger' as const,
    };
  }

  if (diffDays === 0) {
    return {
      badgeClassName: 'border-warning/30 bg-warning/10 text-warning',
      label: 'Due today',
      tone: 'warning' as const,
    };
  }

  if (diffDays <= 3) {
    return {
      badgeClassName: 'border-warning/30 bg-warning/10 text-warning',
      label: `${diffDays} day${diffDays === 1 ? '' : 's'} left`,
      tone: 'warning' as const,
    };
  }

  return {
    badgeClassName: 'border-success/30 bg-success/10 text-success',
    label: `${diffDays} days left`,
    tone: 'positive' as const,
  };
}

export function getStudentAssignmentSubmissionState(row: StudentAssignmentRow) {
  const rawStatus = row.latestSubmission?.status;
  const status = String(rawStatus ?? '')
    .trim()
    .toUpperCase();

  const dueSummary = getDueSummary(row.schedule?.due_at ?? row.assignment?.due_date);

  const hasSubmission = row.submissions?.length > 0;

  const isGraded = status === 'GRADED' || row.latestSubmission?.percentage != null;

  const isReturned = status === 'RETURNED';

  if (!hasSubmission) {
    return {
      key: 'pending' as const,
      label: dueSummary.label === 'Overdue' ? 'Overdue' : 'Pending',
      variant:
        dueSummary.tone === 'danger'
          ? ('destructive' as const)
          : dueSummary.tone === 'warning'
            ? ('warning' as const)
            : ('secondary' as const),
      helper: dueSummary.label === 'Overdue' ? 'Past due date' : 'Awaiting your submission',
    };
  }

  if (isReturned) {
    return {
      key: 'returned' as const,
      label: 'Returned',
      variant: 'warning' as const,
      helper: 'Requires revision and resubmission',
    };
  }

  if (isGraded) {
    return {
      key: 'graded' as const,
      label: 'Graded',
      variant: 'success' as const,
      helper: row.latestSubmission?.grade_display ?? 'Instructor feedback available',
    };
  }

  return {
    key: 'submitted' as const,
    label: status === 'IN_REVIEW' ? 'In review' : 'Submitted',
    variant: 'secondary' as const,
    helper: 'Submitted and awaiting grading',
  };
}

const SUBMISSIONS_PAGE_SIZE = 200;
// Attachments load on demand in the detail view (useAssignmentAttachments).
const NO_ATTACHMENTS: AssignmentAttachment[] = [];

function submissionTime(submission: AssignmentSubmission) {
  return new Date(
    submission.submitted_at ?? submission.updated_date ?? submission.created_date ?? 0
  ).getTime();
}

/** The student's own submissions in one search, grouped by assignment and newest first. */
export function useStudentSubmissionsByEnrollments(enrollmentUuids: string[]) {
  const ids = useMemo(
    () => Array.from(new Set(enrollmentUuids.filter(Boolean))).sort(),
    [enrollmentUuids]
  );

  const query = useQuery({
    ...searchSubmissionsOptions({
      query: {
        searchParams: { enrollment_uuid_in: ids.join(',') },
        pageable: { page: 0, size: SUBMISSIONS_PAGE_SIZE },
      },
    }),
    enabled: ids.length > 0,
    staleTime: STALE_TIMES.live,
    refetchOnWindowFocus: false,
  });

  const submissionMap = useMemo(() => {
    const wanted = new Set(ids);
    const map = new Map<string, AssignmentSubmission[]>();
    for (const submission of query.data?.data?.content ?? []) {
      if (!submission.assignment_uuid || !wanted.has(submission.enrollment_uuid)) continue;
      const list = map.get(submission.assignment_uuid) ?? [];
      list.push(submission);
      map.set(submission.assignment_uuid, list);
    }
    for (const list of map.values()) list.sort((a, b) => submissionTime(b) - submissionTime(a));
    return map;
  }, [ids, query.data]);

  return { submissionMap, isLoading: query.isLoading };
}

/** One assignment's instructor attachments, fetched only while its detail view is open. */
export function useAssignmentAttachments(assignmentUuid: string | undefined, isOpen: boolean) {
  const query = useQuery({
    ...getAssignmentAttachmentsOptions({ path: { assignmentUuid: assignmentUuid ?? '' } }),
    enabled: Boolean(assignmentUuid) && isOpen,
    staleTime: STALE_TIMES.entity,
    refetchOnWindowFocus: false,
  });

  return {
    attachments: (query.data?.data ?? []) as AssignmentAttachment[],
    isLoading: query.isLoading,
  };
}

export function useStudentAssignmentData() {
  const profile = useUserProfile();
  const student = profile?.student;

  // Class, course and enrolment ids come from the course-overview composite; the
  // per-class/per-course chain runs only when that endpoint is unavailable.
  const overview = useStudentCourseOverview();
  const legacy = overview.needsFallback;
  const { classDefinitions, loading: classDefinitionsLoading } = useStudentClassDefinitions(
    legacy ? (student ?? undefined) : undefined
  );

  /**
   * Normalize class items
   */
  const classItems = useMemo(
    () =>
      !legacy
        ? overview.items.map(
            (item): StudentAssignmentClassItem => ({
              classTitle: item.class_title || 'Untitled class',
              classUuid: item.class_definition_uuid,
              courseTitle: item.course_name ?? '',
              studentUuid: student?.uuid,
              courseUuid: item.course_uuid ?? '',
              enrollmentUuid: item.course_enrollment_uuid ?? undefined,
              courseEnrollmentUuid: item.course_enrollment_uuid ?? undefined,
              classEnrollmentUuid: item.latest_enrollment_uuid ?? undefined,
            })
          )
        : (classDefinitions ?? [])
            .map(
              (classDefinition: StudentClassDefinitionRow): StudentAssignmentClassItem | null => {
                const classDetails = classDefinition.classDetails as
                  | ResolvedClassDetails
                  | undefined;

                const classUuid =
                  classDefinition.uuid ||
                  classDetails?.uuid ||
                  classDetails?.class_definition?.uuid;

                if (!classUuid) return null;
                const studentUuid = student?.uuid;

                const enrollmentUuid = classDefinition.courseEnrollments.find(
                  enrollment => enrollment.student_uuid === student?.uuid // && enrollment.status !== 'ACTIVE'
                )?.uuid;

                const courseEnrollmentUuid = classDefinition.courseEnrollments.find(
                  enrollment => enrollment.student_uuid === student?.uuid // && enrollment.status === 'ACTIVE'
                )?.uuid;

                return {
                  classTitle: getClassTitle(classDetails),
                  classUuid,
                  courseTitle:
                    (classDefinition.course?.name as string) ||
                    (classDetails?.course_name as string),
                  studentUuid,
                  courseUuid: classDefinition?.course?.uuid as string,
                  enrollmentUuid,
                  courseEnrollmentUuid,
                };
              }
            )
            .filter((x): x is StudentAssignmentClassItem => Boolean(x)),
    [classDefinitions, legacy, overview.items, student?.uuid]
  );

  const classUuids = useMemo(() => classItems.map(item => item.classUuid), [classItems]);
  const schedulesQuery = useClassAssessmentSchedules(classUuids);

  const scheduleRows = useMemo(() => {
    const classByUuid = new Map(classItems.map(item => [item.classUuid, item]));
    return schedulesQuery.assignmentSchedules.flatMap(schedule => {
      const classMeta = classByUuid.get(schedule.class_definition_uuid ?? '');
      return classMeta ? [{ classMeta, schedule }] : [];
    });
  }, [classItems, schedulesQuery.assignmentSchedules]);

  const assignmentUuids = useMemo(
    () =>
      Array.from(
        new Set(
          scheduleRows
            .map(r => r.schedule.assignment_uuid as string | undefined)
            .filter((x): x is string => Boolean(x))
        )
      ),
    [scheduleRows]
  );

  const { assignmentMap, isLoading: assignmentsLoading } = useAssignmentsByIds(assignmentUuids);

  const enrollmentUuids = useMemo(
    () =>
      classItems.flatMap(item =>
        [item.courseEnrollmentUuid, item.enrollmentUuid, item.classEnrollmentUuid].filter(
          (x): x is string => Boolean(x)
        )
      ),
    [classItems]
  );
  const { submissionMap, isLoading: submissionsLoading } =
    useStudentSubmissionsByEnrollments(enrollmentUuids);

  /**
   * Final rows
   */
  const assignmentRows = useMemo<StudentAssignmentRow[]>(
    () =>
      scheduleRows
        .map(({ classMeta, schedule }) => {
          const assignmentUuid = schedule.assignment_uuid;

          if (!assignmentUuid) return null;

          const assignment = assignmentMap[assignmentUuid];

          if (!assignment) return null;

          const submissions = submissionMap.get(assignmentUuid) ?? [];

          const latestSubmission =
            submissions.find(s => s.enrollment_uuid === classMeta.courseEnrollmentUuid) ??
            submissions[0] ??
            null;

          return {
            assignment,
            attachments: NO_ATTACHMENTS,
            classMeta,
            schedule,
            submissions,
            latestSubmission,
          };
        })
        .filter((x): x is StudentAssignmentRow => Boolean(x)),
    [scheduleRows, assignmentMap, submissionMap]
  );

  /**
   * Loading state
   */
  const isLoading =
    overview.isLoading ||
    classDefinitionsLoading ||
    schedulesQuery.isLoading ||
    assignmentsLoading ||
    submissionsLoading;

  return {
    assignmentRows,
    isLoading,
    student,
  };
}
