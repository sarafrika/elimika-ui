import type {
  Assignment,
  AssignmentSubmission,
  ClassAssignmentSchedule,
  ClassQuizSchedule,
  Quiz,
  QuizAttempt,
} from '@/services/client/types.gen';

export type AssessmentRole = 'student' | 'instructor';
export type AssessmentStatus =
  | 'upcoming'
  | 'pending'
  | 'in-progress'
  | 'awaiting-grading'
  | 'completed'
  | 'overdue'
  | 'returned';
export type AssessmentClass = {
  uuid: string;
  title: string;
  courseUuid: string;
  courseTitle: string;
  instructorUuid: string;
  instructorName: string;
  enrollmentUuids: string[];
  learners: number | null;
};
export type AssessmentRow = {
  id: string;
  uuid: string;
  kind: 'assignment' | 'quiz';
  title: string;
  classMeta: AssessmentClass;
  instructorUuid: string;
  instructorName: string;
  dueAt: number | null;
  issuedAt: number;
  status: AssessmentStatus;
  percentage: number | null;
  submittedCount: number | null;
  gradedCount: number | null;
  href: string;
  maxPoints?: number;
  passingPercentage?: number;
};

export type AssessmentResultRow = {
  id: string;
  assessment: AssessmentRow;
  enrollmentUuid: string;
  submittedAt: number | null;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  grade: string | null;
  passed: boolean | null;
  status: 'completed' | 'awaiting-grading' | 'returned';
  href: string;
};

export const assessmentStatusLabels: Record<AssessmentStatus, string> = {
  upcoming: 'Upcoming',
  pending: 'Not started',
  'in-progress': 'In progress',
  'awaiting-grading': 'Awaiting grading',
  completed: 'Completed',
  overdue: 'Overdue',
  returned: 'Returned',
};

export function timestamp(value?: Date | string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

type Result = AssignmentSubmission | QuizAttempt;

function isSubmitted(result: Result) {
  return (
    ['SUBMITTED', 'IN_REVIEW', 'GRADED'].includes(result.status?.toUpperCase()) ||
    Boolean(result.submitted_at) ||
    ('is_completed' in result && result.is_completed === true)
  );
}

function isGraded(result: Result) {
  return (
    result.status?.toUpperCase() === 'GRADED' ||
    Boolean(result.graded_at) ||
    ('is_graded' in result && result.is_graded === true)
  );
}

function percentage(result: Result, maxPoints?: number) {
  if (typeof result.percentage === 'number' && Number.isFinite(result.percentage))
    return result.percentage;
  const maximum = result.max_score ?? maxPoints;
  return typeof result.score === 'number' && maximum != null && maximum > 0
    ? (result.score / maximum) * 100
    : null;
}

/** Retakes count once per learner, using their latest activity rather than response order. */
export function latestResults<T extends Result>(results: T[]) {
  const map = new Map<string, T>();
  const activity = (result: Result) =>
    timestamp(result.updated_date) ??
    timestamp(result.submitted_at) ??
    timestamp(result.created_date) ??
    0;
  for (const result of results) {
    const previous = map.get(result.enrollment_uuid);
    if (!previous || activity(result) > activity(previous)) map.set(result.enrollment_uuid, result);
  }
  return [...map.values()];
}

export function buildAssessmentRows({
  role,
  classes,
  assignments,
  quizzes,
  assignmentSchedules,
  quizSchedules,
  submissions,
  attempts,
  instructorNames = {},
  now = Date.now(),
}: {
  role: AssessmentRole;
  classes: AssessmentClass[];
  assignments: Record<string, Assignment>;
  quizzes: Record<string, Quiz>;
  assignmentSchedules: ClassAssignmentSchedule[];
  quizSchedules: ClassQuizSchedule[];
  submissions: AssignmentSubmission[];
  attempts: QuizAttempt[];
  instructorNames?: Record<string, string>;
  now?: number;
}): AssessmentRow[] {
  const classMap = new Map(classes.map(item => [item.uuid, item]));
  const rows = new Map<string, AssessmentRow>();
  const schedules = [
    ...assignmentSchedules.map(schedule => ({
      kind: 'assignment' as const,
      schedule,
      uuid: schedule.assignment_uuid,
    })),
    ...quizSchedules.map(schedule => ({
      kind: 'quiz' as const,
      schedule,
      uuid: schedule.quiz_uuid,
    })),
  ];
  const classesPerTask = new Map<string, Set<string>>();
  for (const { kind, uuid, schedule } of schedules) {
    const key = `${kind}-${uuid}`;
    const ids = classesPerTask.get(key) ?? new Set<string>();
    if (schedule.class_definition_uuid) ids.add(schedule.class_definition_uuid);
    classesPerTask.set(key, ids);
  }

  for (const { kind, schedule, uuid } of schedules) {
    const classMeta = classMap.get(schedule.class_definition_uuid ?? '');
    if (!uuid || !classMeta) continue;
    const entity = kind === 'quiz' ? quizzes[uuid] : assignments[uuid];
    // Keep issued tasks visible even if a template lookup omits a row.
    const visibleAt = timestamp(schedule.visible_at);
    if (role === 'student' && visibleAt != null && visibleAt > now) continue;
    const dueAt = timestamp(
      schedule.due_at ?? (kind === 'assignment' ? assignments[uuid]?.due_date : undefined)
    );
    const allowedEnrollments = new Set(classMeta.enrollmentUuids);
    const source =
      kind === 'quiz'
        ? attempts.filter(item => item.quiz_uuid === uuid)
        : submissions.filter(item => item.assignment_uuid === uuid);
    // A reused template has no class identifier on its submissions. Do not attribute the
    // combined results to each class; instructors can review the scoped class workspace.
    const canScope =
      role === 'student' ||
      classesPerTask.get(`${kind}-${uuid}`)?.size === 1 ||
      entity?.class_definition_uuid === classMeta.uuid;
    const results = latestResults(
      role === 'student'
        ? source.filter(item => allowedEnrollments.has(item.enrollment_uuid))
        : canScope
          ? source
          : []
    );
    const submitted = results.filter(isSubmitted);
    const graded = submitted.filter(item => kind === 'quiz' || isGraded(item));
    const scores = graded
      .map(item =>
        percentage(item, kind === 'assignment' ? assignments[uuid]?.max_points : undefined)
      )
      .filter((value): value is number => value != null);
    const returned = results.some(item => item.status?.toUpperCase() === 'RETURNED');
    const status: AssessmentStatus = returned
      ? 'returned'
      : submitted.length > graded.length
        ? 'awaiting-grading'
        : submitted.length > 0 &&
            (role === 'student' ||
              classMeta.learners == null ||
              submitted.length >= classMeta.learners)
          ? 'completed'
          : visibleAt != null && visibleAt > now
            ? 'upcoming'
            : dueAt != null && dueAt < now
              ? 'overdue'
              : results.length > 0
                ? 'in-progress'
                : 'pending';
    const instructorUuid = schedule.instructor_uuid || classMeta.instructorUuid;
    const id = `${kind}-${uuid}-${classMeta.uuid}-${schedule.uuid ?? schedule.lesson_uuid ?? 'schedule'}`;
    rows.set(id, {
      id,
      uuid,
      kind,
      title: entity?.title || (kind === 'quiz' ? 'Untitled quiz' : 'Untitled assignment'),
      classMeta,
      instructorUuid,
      instructorName: instructorNames[instructorUuid] || classMeta.instructorName || 'Instructor',
      dueAt,
      issuedAt: timestamp(schedule.created_date) ?? visibleAt ?? 0,
      status,
      percentage: scores.length
        ? scores.reduce((sum, value) => sum + value, 0) / scores.length
        : null,
      submittedCount: canScope ? submitted.length : null,
      gradedCount: canScope ? graded.length : null,
      href:
        role === 'student'
          ? kind === 'quiz'
            ? `/dashboard/student/assignment/quiz/${uuid}`
            : `/dashboard/student/assignment/${uuid}`
          : `/dashboard/instructor/assignment/${kind}_${uuid}?classId=${classMeta.uuid}`,
      maxPoints: kind === 'assignment' ? assignments[uuid]?.max_points : undefined,
      passingPercentage: kind === 'quiz' ? quizzes[uuid]?.passing_score : undefined,
    });
  }
  return [...rows.values()];
}

/** One latest submitted result per learner and assessment; drafts never become result rows. */
export function buildAssessmentResultRows(
  assessments: AssessmentRow[],
  submissions: AssignmentSubmission[],
  attempts: QuizAttempt[],
  role: AssessmentRole
): AssessmentResultRow[] {
  const rows = new Map<string, AssessmentResultRow>();
  for (const assessment of assessments) {
    if (assessment.submittedCount == null) continue;
    const allowed = new Set(assessment.classMeta.enrollmentUuids);
    const source =
      assessment.kind === 'quiz'
        ? attempts.filter(item => item.quiz_uuid === assessment.uuid)
        : submissions.filter(item => item.assignment_uuid === assessment.uuid);
    const records = latestResults(
      source.filter(
        item => isSubmitted(item) && (role === 'instructor' || allowed.has(item.enrollment_uuid))
      )
    );
    for (const record of records) {
      const graded = assessment.kind === 'quiz' || isGraded(record);
      const status =
        record.status?.toUpperCase() === 'RETURNED'
          ? 'returned'
          : graded
            ? 'completed'
            : 'awaiting-grading';
      const id = `${assessment.kind}-${assessment.uuid}-${assessment.classMeta.uuid}-${record.enrollment_uuid}`;
      const resultPercentage = graded ? percentage(record, assessment.maxPoints) : null;
      const grade = graded ? (record.grade_display ?? null) : null;
      const passed =
        status !== 'completed'
          ? null
          : 'is_passed' in record && typeof record.is_passed === 'boolean'
            ? record.is_passed
            : resultPercentage != null &&
                assessment.passingPercentage != null &&
                Number.isFinite(assessment.passingPercentage)
              ? resultPercentage >= assessment.passingPercentage
              : /^(distinction|merit|pass|passed|achieved)$/i.test(grade?.trim() ?? '')
                ? true
                : /^(fail|failed|no effort|not achieved)$/i.test(grade?.trim() ?? '')
                  ? false
                  : null;
      rows.set(id, {
        id,
        assessment,
        enrollmentUuid: record.enrollment_uuid,
        submittedAt: timestamp(record.submitted_at),
        score: graded ? (record.score ?? null) : null,
        maxScore: record.max_score ?? assessment.maxPoints ?? null,
        percentage: resultPercentage,
        grade,
        passed,
        status,
        href:
          role === 'instructor'
            ? `${assessment.href}&enrollment=${record.enrollment_uuid}`
            : assessment.href,
      });
    }
  }
  return [...rows.values()].sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0));
}
