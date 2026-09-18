import { parseApiDate } from '@/lib/date';
import type { AssignmentSubmission, QuizAttempt } from '@/services/client/types.gen';

// The API can return lowercase statuses despite the generated uppercase enum.
type TaskGradeRecord = Pick<
  AssignmentSubmission | QuizAttempt,
  'score' | 'max_score' | 'grade_display'
> & { status: string };

export function isTaskSubmitted(record: { status: string } | undefined) {
  return ['SUBMITTED', 'IN_REVIEW', 'GRADED'].includes(record?.status.toUpperCase() ?? '');
}

export function isTaskGraded(record: { status: string } | undefined) {
  return record?.status.toUpperCase() === 'GRADED';
}

export function isWrittenQuestion(questionType?: string) {
  return ['SHORT_ANSWER', 'SHORT_TEXT', 'ESSAY'].includes(questionType?.toUpperCase() ?? '');
}

export function taskGradeLabel(record: TaskGradeRecord | undefined, maxPoints?: number) {
  if (!record || !isTaskSubmitted(record)) return 'Not submitted';
  const status = record.status.toUpperCase();
  if (status !== 'GRADED') return 'Not graded';
  if (record.score == null) return record.grade_display || 'Grade unavailable';
  const maximum = record.max_score ?? maxPoints;
  return (
    record.grade_display ||
    (maximum == null ? String(record.score) : `${record.score} / ${maximum}`)
  );
}

export function isValidGrade(value: string, maximum: number) {
  const score = Number(value);
  return (
    value.trim() !== '' &&
    Number.isFinite(score) &&
    Number.isFinite(maximum) &&
    maximum > 0 &&
    score >= 0 &&
    score <= maximum
  );
}

export function newestSubmissionsFirst<T extends { submitted_at?: Date | null }>(items: T[]) {
  return [...items].sort(
    (a, b) =>
      (parseApiDate(b.submitted_at)?.valueOf() ?? 0) -
      (parseApiDate(a.submitted_at)?.valueOf() ?? 0)
  );
}
