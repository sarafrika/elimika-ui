'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useStudent } from '@/context/student-context';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import {
  getAssignmentAttachmentsOptions,
  getAssignmentByUuidOptions,
  getAssignmentSchedulesOptions,
  getAssignmentSubmissionsOptions,
  getEnrollmentsForClassOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Assignment,
  AssignmentAttachment,
  AssignmentSubmission,
  ClassAssignmentSchedule,
  Enrollment,
} from '@/services/client/types.gen';

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
  enrollmentUuid?: string;
};

export type StudentAssignmentRow = {
  assignment: Assignment;
  attachments: AssignmentAttachment[];
  classMeta: StudentAssignmentClassMeta;
  latestSubmission: AssignmentSubmission | null;
  schedule: ClassAssignmentSchedule;
  submissions: AssignmentSubmission[];
};

function getClassTitle(classDetails?: ResolvedClassDetails) {
  return (
    classDetails?.class_definition?.title ||
    classDetails?.title ||
    classDetails?.name ||
    'Untitled class'
  );
}

function getDueSummary(value?: string | Date | null) {
  if (!value) {
    return {
      label: 'Self paced',
      tone: 'neutral' as const,
    };
  }

  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) {
    return {
      label: 'No deadline',
      tone: 'neutral' as const,
    };
  }

  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: 'Overdue',
      tone: 'danger' as const,
    };
  }

  if (diffDays === 0) {
    return {
      label: 'Due today',
      tone: 'warning' as const,
    };
  }

  if (diffDays <= 3) {
    return {
      label: `${diffDays} day${diffDays === 1 ? '' : 's'} left`,
      tone: 'warning' as const,
    };
  }

  return {
    label: `${diffDays} days left`,
    tone: 'positive' as const,
  };
}

export function getStudentAssignmentSubmissionState(row: StudentAssignmentRow) {
  const status = String(row.latestSubmission?.status ?? '').toUpperCase();
  const dueSummary = getDueSummary(row.schedule?.due_at ?? row.assignment?.due_date);

  if (!row.latestSubmission) {
    return {
      key: 'pending' as StudentAssignmentFilterTab,
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

  if (status === 'GRADED') {
    return {
      key: 'graded' as StudentAssignmentFilterTab,
      label: 'Graded',
      variant: 'success' as const,
      helper: row.latestSubmission.grade_display || 'Instructor feedback available',
    };
  }

  if (status === 'RETURNED') {
    return {
      key: 'returned' as StudentAssignmentFilterTab,
      label: 'Returned',
      variant: 'warning' as const,
      helper: 'Requires revision and resubmission',
    };
  }

  return {
    key: 'submitted' as StudentAssignmentFilterTab,
    label: status === 'IN_REVIEW' ? 'In review' : 'Submitted',
    variant: 'secondary' as const,
    helper: 'Submitted and awaiting grading',
  };
}

export function useStudentAssignmentData() {
  const student = useStudent();
  const { classDefinitions, loading: classDefinitionsLoading } =
    useStudentClassDefinitions(student);

  const classItems = useMemo(
    () =>
      (classDefinitions ?? [])
        .map((classDefinition: StudentClassDefinitionRow) => {
          const classDetails = classDefinition.classDetails as ResolvedClassDetails | undefined;

          return {
            classTitle: getClassTitle(classDetails),
            classUuid:
              classDefinition.uuid || classDetails?.uuid || classDetails?.class_definition?.uuid,
            courseTitle:
              classDefinition.course?.name || classDetails?.course_name || 'Untitled course',
          };
        })
        .filter(
          (
            classItem
          ): classItem is {
            classTitle: string;
            classUuid: string;
            courseTitle: string;
          } => Boolean(classItem.classUuid)
        ),
    [classDefinitions]
  );

  const classEnrollmentQueries = useQueries({
    queries: classItems.map(classItem => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid: classItem.classUuid },
      }),
      enabled: Boolean(student?.uuid && classItem.classUuid),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const classMetaList = useMemo<StudentAssignmentClassMeta[]>(
    () =>
      classItems.map((classItem, index) => {
        const enrollments = classEnrollmentQueries[index]?.data?.data ?? [];
        const matchingEnrollment =
          enrollments.find((enrollment: Enrollment) => enrollment.student_uuid === student?.uuid) ??
          null;

        return {
          ...classItem,
          enrollmentUuid: matchingEnrollment?.uuid,
        };
      }),
    [classEnrollmentQueries, classItems, student?.uuid]
  );

  const studentEnrollmentUuids = useMemo(
    () =>
      classMetaList
        .map(classMeta => classMeta.enrollmentUuid)
        .filter((enrollmentUuid): enrollmentUuid is string => Boolean(enrollmentUuid)),
    [classMetaList]
  );

  const assignmentScheduleQueries = useQueries({
    queries: classMetaList.map(classMeta => ({
      ...getAssignmentSchedulesOptions({
        path: { classUuid: classMeta.classUuid },
      }),
      enabled: Boolean(student?.uuid && classMeta.classUuid),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const scheduleRows = useMemo(
    () =>
      classMetaList.flatMap((classMeta, index) => {
        const schedules = assignmentScheduleQueries[index]?.data?.data ?? [];
        return schedules.map((schedule: ClassAssignmentSchedule) => ({ classMeta, schedule }));
      }),
    [assignmentScheduleQueries, classMetaList]
  );

  const assignmentUuids = useMemo(
    () =>
      Array.from(
        new Set(
          scheduleRows
            .map(({ schedule }) => schedule.assignment_uuid as string | undefined)
            .filter((assignmentUuid): assignmentUuid is string => Boolean(assignmentUuid))
        )
      ),
    [scheduleRows]
  );

  const assignmentDetailQueries = useQueries({
    queries: assignmentUuids.map(assignmentUuid => ({
      ...getAssignmentByUuidOptions({
        path: { uuid: assignmentUuid },
      }),
      enabled: Boolean(student?.uuid && assignmentUuid),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const assignmentAttachmentQueries = useQueries({
    queries: assignmentUuids.map(assignmentUuid => ({
      ...getAssignmentAttachmentsOptions({
        path: { assignmentUuid },
      }),
      enabled: Boolean(student?.uuid && assignmentUuid),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const assignmentSubmissionQueries = useQueries({
    queries: assignmentUuids.map(assignmentUuid => ({
      ...getAssignmentSubmissionsOptions({
        path: { assignmentUuid },
      }),
      enabled: Boolean(student?.uuid && assignmentUuid),
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const assignmentMap = useMemo(() => {
    const map = new Map<string, Assignment>();
    assignmentUuids.forEach((assignmentUuid, index) => {
      const assignment = assignmentDetailQueries[index]?.data?.data;
      if (assignment) {
        map.set(assignmentUuid, assignment);
      }
    });
    return map;
  }, [assignmentDetailQueries, assignmentUuids]);

  const assignmentAttachmentsMap = useMemo(() => {
    const map = new Map<string, AssignmentAttachment[]>();
    assignmentUuids.forEach((assignmentUuid, index) => {
      map.set(assignmentUuid, assignmentAttachmentQueries[index]?.data?.data ?? []);
    });
    return map;
  }, [assignmentAttachmentQueries, assignmentUuids]);

  const submissionMap = useMemo(() => {
    const map = new Map<string, AssignmentSubmission[]>();

    assignmentUuids.forEach((assignmentUuid, index) => {
      const submissions = assignmentSubmissionQueries[index]?.data?.data ?? [];
      const studentSubmissions = submissions
        .filter((submission: AssignmentSubmission) =>
          studentEnrollmentUuids.includes(submission.enrollment_uuid)
        )
        .sort((left: AssignmentSubmission, right: AssignmentSubmission) => {
          const leftTime = new Date(
            left.submitted_at || left.updated_date || left.created_date || 0
          ).getTime();
          const rightTime = new Date(
            right.submitted_at || right.updated_date || right.created_date || 0
          ).getTime();
          return rightTime - leftTime;
        });

      map.set(assignmentUuid, studentSubmissions);
    });

    return map;
  }, [assignmentSubmissionQueries, assignmentUuids, studentEnrollmentUuids]);

  const assignmentRows = useMemo<StudentAssignmentRow[]>(
    () =>
      scheduleRows
        .map(({ classMeta, schedule }) => {
          const assignmentUuid = schedule.assignment_uuid as string | undefined;
          if (!assignmentUuid) return null;

          const assignment = assignmentMap.get(assignmentUuid);
          if (!assignment) return null;

          const submissions = (submissionMap.get(assignmentUuid) ?? []).filter(
            submission => submission.enrollment_uuid === classMeta.enrollmentUuid
          );

          return {
            assignment,
            attachments: assignmentAttachmentsMap.get(assignmentUuid) ?? [],
            classMeta,
            latestSubmission: submissions[0] ?? null,
            schedule,
            submissions,
          };
        })
        .filter((row): row is StudentAssignmentRow => Boolean(row)),
    [assignmentAttachmentsMap, assignmentMap, scheduleRows, submissionMap]
  );

  const isLoading =
    classDefinitionsLoading ||
    classEnrollmentQueries.some(query => query.isLoading) ||
    assignmentScheduleQueries.some(query => query.isLoading) ||
    assignmentDetailQueries.some(query => query.isLoading) ||
    assignmentAttachmentQueries.some(query => query.isLoading) ||
    assignmentSubmissionQueries.some(query => query.isLoading);

  return {
    assignmentRows,
    isLoading,
    student,
  };
}
