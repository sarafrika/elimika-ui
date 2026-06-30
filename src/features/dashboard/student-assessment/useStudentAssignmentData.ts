'use client';

import { useStudent } from '@/context/student-context';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import {
  getAssignmentAttachmentsOptions,
  getAssignmentByUuidOptions,
  getAssignmentSchedulesOptions,
  getAssignmentSubmissionsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Assignment,
  AssignmentAttachment,
  AssignmentSubmission,
  ClassAssignmentSchedule,
} from '@/services/client/types.gen';
import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

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

export type StudentAssignmentFilterTab =
  | 'all'
  | 'pending'
  | 'submitted'
  | 'graded'
  | 'returned';

export type StudentAssignmentClassMeta = {
  classUuid: string;
  classTitle: string;
  courseTitle: string;
  courseUuid: string;
  studentUuid?: string
  enrollmentUuid?: string;
  courseEnrollmentUuid?: string
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
  courseEnrollmentUuid?: string
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
  const status = String(rawStatus ?? '').trim().toUpperCase();

  const dueSummary = getDueSummary(
    row.schedule?.due_at ?? row.assignment?.due_date
  );

  const hasSubmission = row.submissions?.length > 0;

  const isGraded =
    status === 'GRADED' ||
    row.latestSubmission?.percentage != null;

  const isReturned = status === 'RETURNED';

  if (!hasSubmission) {
    return {
      key: 'pending' as const,
      label: dueSummary.label === 'Overdue' ? 'Overdue' : 'Pending',
      variant:
        dueSummary.tone === 'danger'
          ? 'destructive'
          : dueSummary.tone === 'warning'
            ? 'warning'
            : 'secondary',
      helper:
        dueSummary.label === 'Overdue'
          ? 'Past due date'
          : 'Awaiting your submission',
    };
  }

  if (isGraded) {
    return {
      key: 'graded' as const,
      label: 'Graded',
      variant: 'success',
      helper:
        row.latestSubmission?.grade_display ??
        'Instructor feedback available',
    };
  }

  if (isReturned) {
    return {
      key: 'returned' as const,
      label: 'Returned',
      variant: 'warning',
      helper: 'Requires revision and resubmission',
    };
  }

  return {
    key: 'submitted' as const,
    label: status === 'IN_REVIEW' ? 'In review' : 'Submitted',
    variant: 'secondary',
    helper: 'Submitted and awaiting grading',
  };
}

export function useStudentAssignmentData() {
  const student = useStudent();

  const {
    classDefinitions,
    loading: classDefinitionsLoading,
  } = useStudentClassDefinitions(student ?? undefined);

  /**
   * Normalize class items
   */
  const classItems = useMemo(
    () =>
      (classDefinitions ?? [])
        .map(
          (
            classDefinition: StudentClassDefinitionRow
          ): StudentAssignmentClassItem | null => {
            const classDetails =
              classDefinition.classDetails as
              | ResolvedClassDetails
              | undefined;

            const classUuid =
              classDefinition.uuid ||
              classDetails?.uuid ||
              classDetails?.class_definition?.uuid;

            if (!classUuid) return null;
            const studentUuid = student?.uuid;

            const enrollmentUuid =
              classDefinition.courseEnrollments.find(
                enrollment =>
                  enrollment.student_uuid === student?.uuid &&
                  enrollment.status !== 'ACTIVE'
              )?.uuid;

            const courseEnrollmentUuid =
              classDefinition.courseEnrollments.find(
                enrollment =>
                  enrollment.student_uuid === student?.uuid &&
                  enrollment.status === 'ACTIVE'
              )?.uuid;

            return {
              classTitle: getClassTitle(classDetails),
              classUuid,
              courseTitle:
                classDefinition.course?.name as string ||
                classDetails?.course_name as string,
              studentUuid,
              courseUuid: classDefinition?.course?.uuid,
              enrollmentUuid,
              courseEnrollmentUuid
            };
          }
        )
        .filter(
          (x): x is StudentAssignmentClassItem =>
            Boolean(x)
        ),
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
        const schedules =
          assignmentScheduleQueries[index]?.data?.data ??
          [];

        return schedules.map(
          (schedule: ClassAssignmentSchedule) => ({
            classMeta: classItem,
            schedule,
          })
        );
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
            .map(
              r =>
                r.schedule.assignment_uuid as
                | string
                | undefined
            )
            .filter(
              (x): x is string => Boolean(x)
            )
        )
      ),
    [scheduleRows]
  );

  /**
   * Assignment details
   */
  const assignmentDetailQueries = useQueries({
    queries: assignmentUuids.map(uuid => ({
      ...getAssignmentByUuidOptions({
        path: { uuid },
      }),
      enabled: Boolean(student?.uuid && uuid),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  /**
   * Assignment attachments
   */
  const assignmentAttachmentQueries = useQueries({
    queries: assignmentUuids.map(uuid => ({
      ...getAssignmentAttachmentsOptions({
        path: { assignmentUuid: uuid },
      }),
      enabled: Boolean(student?.uuid && uuid),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  /**
   * Submissions
   */
  const assignmentSubmissionQueries = useQueries({
    queries: assignmentUuids.map(uuid => ({
      ...getAssignmentSubmissionsOptions({
        path: { assignmentUuid: uuid },
      }),
      // enabled: Boolean(student?.uuid && uuid),
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  /**
   * Maps
   */
  const assignmentMap = useMemo(() => {
    const map = new Map<string, Assignment>();

    assignmentUuids.forEach((uuid, i) => {
      const assignment =
        assignmentDetailQueries[i]?.data?.data;

      if (assignment) {
        map.set(uuid, assignment);
      }
    });

    return map;
  }, [assignmentDetailQueries, assignmentUuids]);

  const attachmentsMap = useMemo(() => {
    const map = new Map<
      string,
      AssignmentAttachment[]
    >();

    assignmentUuids.forEach((uuid, i) => {
      map.set(
        uuid,
        assignmentAttachmentQueries[i]?.data?.data ??
        []
      );
    });

    return map;
  }, [assignmentAttachmentQueries, assignmentUuids]);


  const studentEnrollmentUuids = new Set(
    classItems
      .map(item => item.courseEnrollmentUuid ?? item.enrollmentUuid)
      .filter(Boolean)
  );

  const submissionMap = useMemo(() => {
    const map = new Map<
      string,
      AssignmentSubmission[]
    >();

    assignmentUuids.forEach((uuid, i) => {
      const submissions =
        assignmentSubmissionQueries[i]?.data?.data ?? [];

      const filtered = submissions
        .filter(sub =>
          studentEnrollmentUuids.has(sub.enrollment_uuid)
        )
        .sort((a, b) => {
          const at = new Date(a.submitted_at ?? a.updated_date ?? a.created_date ?? 0).getTime();
          const bt = new Date(b.submitted_at ?? b.updated_date ?? b.created_date ?? 0).getTime();
          return bt - at;
        });

      map.set(uuid, filtered);
    });

    return map;
  }, [
    assignmentSubmissionQueries,
    assignmentUuids,
    studentEnrollmentUuids,
  ]);

  /**
   * Final rows
   */
  const assignmentRows = useMemo<StudentAssignmentRow[]>(
    () =>
      scheduleRows
        .map(({ classMeta, schedule }) => {
          const assignmentUuid =
            schedule.assignment_uuid;

          if (!assignmentUuid) return null;

          const assignment =
            assignmentMap.get(assignmentUuid);

          if (!assignment) return null;

          const submissions =
            submissionMap.get(assignmentUuid) ?? [];

          const latestSubmission =
            submissions.find(s => s.enrollment_uuid === classMeta.courseEnrollmentUuid) ??
            submissions[0] ??
            null;

          return {
            assignment,
            attachments:
              attachmentsMap.get(assignmentUuid) ??
              [],
            classMeta,
            schedule,
            submissions,
            latestSubmission,
          };
        })
        .filter(
          (x): x is StudentAssignmentRow =>
            Boolean(x)
        ),
    [scheduleRows, assignmentMap, attachmentsMap, submissionMap]
  );

  /**
   * Loading state
   */
  const isLoading =
    classDefinitionsLoading ||
    assignmentScheduleQueries.some(
      q => q.isLoading
    ) ||
    assignmentDetailQueries.some(
      q => q.isLoading
    ) ||
    assignmentAttachmentQueries.some(
      q => q.isLoading
    ) ||
    assignmentSubmissionQueries.some(
      q => q.isLoading
    );

  return {
    assignmentRows,
    isLoading,
    student,
  };
}