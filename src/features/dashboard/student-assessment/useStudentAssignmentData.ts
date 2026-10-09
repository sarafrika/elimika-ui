'use client';

import { useAssignmentsByIds } from '@/hooks/use-batched-lookups';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getAssignmentAttachmentsOptions,
  getAssignmentSchedulesOptions,
  searchSubmissionsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Assignment,
  AssignmentAttachment,
  AssignmentSubmission,
  ClassAssignmentSchedule,
} from '@/services/client/types.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
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

export const STUDENT_SUBMISSION_PAGE_SIZE = 500;

type OwnedEnrollment = { uuid?: string; enrollment_uuid?: string; student_uuid?: string };

type ClassDefinitionEnrollments = {
  classEnrollments?: OwnedEnrollment[];
  courseEnrollments?: OwnedEnrollment[];
};

/** Sorted so this hook and useStudentAssignmentData share one submissions search key. */
export function collectStudentEnrollmentUuids(
  classDefinitions: ClassDefinitionEnrollments[],
  studentUuid?: string
): string[] {
  const ids = new Set<string>();
  if (!studentUuid) return [];
  for (const item of classDefinitions) {
    for (const enrollment of [...(item.classEnrollments ?? []), ...(item.courseEnrollments ?? [])]) {
      const id = enrollment.uuid ?? enrollment.enrollment_uuid;
      if (id && enrollment.student_uuid === studentUuid) ids.add(id);
    }
  }
  return Array.from(ids).sort((a, b) => a.localeCompare(b));
}

type UseStudentAssignmentDataOptions = {
  /** Skip per-assignment attachment fetches for summary views that never render them. */
  includeAttachments?: boolean;
};

export function useStudentAssignmentData({
  includeAttachments = true,
}: UseStudentAssignmentDataOptions = {}) {
  const profile = useUserProfile();
  const student = profile?.student;

  const { classDefinitions, loading: classDefinitionsLoading } = useStudentClassDefinitions(
    student ?? undefined
  );

  /**
   * Normalize class items
   */
  const classItems = useMemo(
    () =>
      (classDefinitions ?? [])
        .map((classDefinition: StudentClassDefinitionRow): StudentAssignmentClassItem | null => {
          const classDetails = classDefinition.classDetails as ResolvedClassDetails | undefined;

          const classUuid =
            classDefinition.uuid || classDetails?.uuid || classDetails?.class_definition?.uuid;

          if (!classUuid) return null;
          const studentUuid = student?.uuid;

          const enrollmentUuid = classDefinition.courseEnrollments.find(
            enrollment =>
              enrollment.student_uuid === student?.uuid // && enrollment.status !== 'ACTIVE'
          )?.uuid;

          const courseEnrollmentUuid = classDefinition.courseEnrollments.find(
            enrollment =>
              enrollment.student_uuid === student?.uuid // && enrollment.status === 'ACTIVE'
          )?.uuid;

          return {
            classTitle: getClassTitle(classDetails),
            classUuid,
            courseTitle:
              (classDefinition.course?.name as string) || (classDetails?.course_name as string),
            studentUuid,
            courseUuid: classDefinition?.course?.uuid as string,
            enrollmentUuid,
            courseEnrollmentUuid,
          };
        })
        .filter((x): x is StudentAssignmentClassItem => Boolean(x)),
    [classDefinitions]
  );

  /**
   * Assignment schedules per class
   */
  const assignmentScheduleQueries = useQueries({
    queries: classItems.map(classItem => ({
      ...getAssignmentSchedulesOptions({
        path: { classUuid: classItem.classUuid },
      }),
      enabled: Boolean(student?.uuid && classItem.classUuid),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  /**
   * Flatten schedules
   */
  const scheduleRows = useMemo(
    () =>
      classItems.flatMap((classItem, index) => {
        const schedules = assignmentScheduleQueries[index]?.data?.data ?? [];

        return schedules.map((schedule: ClassAssignmentSchedule) => ({
          classMeta: classItem,
          schedule,
        }));
      }),
    [assignmentScheduleQueries, classItems]
  );

  /**
   * Unique assignment IDs
   */
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

  const { assignmentMap: assignmentsById, isLoading: assignmentsLoading } =
    useAssignmentsByIds(assignmentUuids);

  /**
   * Assignment attachments
   */
  const assignmentAttachmentQueries = useQueries({
    queries: assignmentUuids.map(uuid => ({
      ...getAssignmentAttachmentsOptions({
        path: { assignmentUuid: uuid },
      }),
      enabled: Boolean(includeAttachments && student?.uuid && uuid),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  /**
   * Submissions: one enrollment-scoped search instead of a request per assignment
   */
  const submissionEnrollmentUuids = useMemo(
    () => collectStudentEnrollmentUuids(classDefinitions ?? [], student?.uuid),
    [classDefinitions, student?.uuid]
  );

  const { data: submissionsResponse, isLoading: submissionsLoading } = useQuery({
    ...searchSubmissionsOptions({
      query: {
        searchParams: { enrollment_uuid_in: submissionEnrollmentUuids.join(',') },
        pageable: { page: 0, size: STUDENT_SUBMISSION_PAGE_SIZE },
      },
    }),
    enabled: submissionEnrollmentUuids.length > 0 && assignmentUuids.length > 0,
    staleTime: STALE_TIMES.live,
    refetchOnWindowFocus: false,
  });

  /**
   * Maps
   */
  const assignmentMap = useMemo(() => {
    const map = new Map<string, Assignment>();

    for (const uuid of assignmentUuids) {
      const assignment = assignmentsById[uuid];
      if (assignment) map.set(uuid, assignment);
    }

    return map;
  }, [assignmentsById, assignmentUuids]);

  const attachmentsMap = useMemo(() => {
    const map = new Map<string, AssignmentAttachment[]>();

    assignmentUuids.forEach((uuid, i) => {
      map.set(uuid, assignmentAttachmentQueries[i]?.data?.data ?? []);
    });

    return map;
  }, [assignmentAttachmentQueries, assignmentUuids]);

  const studentEnrollmentUuids = new Set(
    classItems.map(item => item.courseEnrollmentUuid ?? item.enrollmentUuid).filter(Boolean)
  );

  const submissionMap = useMemo(() => {
    const map = new Map<string, AssignmentSubmission[]>();

    const allSubmissions: AssignmentSubmission[] = submissionsResponse?.data?.content ?? [];

    assignmentUuids.forEach(uuid => {
      const filtered = allSubmissions
        .filter(
          sub => sub.assignment_uuid === uuid && studentEnrollmentUuids.has(sub.enrollment_uuid)
        )
        .sort((a, b) => {
          const at = new Date(a.submitted_at ?? a.updated_date ?? a.created_date ?? 0).getTime();
          const bt = new Date(b.submitted_at ?? b.updated_date ?? b.created_date ?? 0).getTime();
          return bt - at;
        });

      map.set(uuid, filtered);
    });

    return map;
  }, [assignmentUuids, studentEnrollmentUuids, submissionsResponse]);

  /**
   * Final rows
   */
  const assignmentRows = useMemo<StudentAssignmentRow[]>(
    () =>
      scheduleRows
        .map(({ classMeta, schedule }) => {
          const assignmentUuid = schedule.assignment_uuid;

          if (!assignmentUuid) return null;

          const assignment = assignmentMap.get(assignmentUuid);

          if (!assignment) return null;

          const submissions = submissionMap.get(assignmentUuid) ?? [];

          const latestSubmission =
            submissions.find(s => s.enrollment_uuid === classMeta.courseEnrollmentUuid) ??
            submissions[0] ??
            null;

          return {
            assignment,
            attachments: attachmentsMap.get(assignmentUuid) ?? [],
            classMeta,
            schedule,
            submissions,
            latestSubmission,
          };
        })
        .filter((x): x is StudentAssignmentRow => Boolean(x)),
    [scheduleRows, assignmentMap, attachmentsMap, submissionMap]
  );

  /**
   * Loading state
   */
  const isLoading =
    classDefinitionsLoading ||
    assignmentScheduleQueries.some(q => q.isLoading) ||
    assignmentsLoading ||
    assignmentAttachmentQueries.some(q => q.isLoading) ||
    submissionsLoading;

  return {
    assignmentRows,
    isLoading,
    student,
  };
}
