import { toUtcIsoDateTime } from '@/lib/date';

export function assessmentDates(
  visibleAt: string,
  dueAt: string,
  gradingAt: string,
  timezone: string
) {
  const utc = (value: string) => {
    const [date, time] = value.split('T');
    if (!date || !time) throw new Error('Enter all three scheduling dates.');
    const parsed = new Date(toUtcIsoDateTime(date, time, timezone));
    if (!Number.isFinite(parsed.getTime())) throw new Error('Enter valid scheduling dates.');
    return parsed;
  };
  const visible = utc(visibleAt);
  const due = utc(dueAt);
  const grading = utc(gradingAt);
  if (due < visible) throw new Error('The submission deadline cannot be before the release date.');
  if (grading < due)
    throw new Error('The grading deadline cannot be before the submission deadline.');
  return { visible, due, grading };
}

export function belongsToSession(schedule: object, sessionId?: string) {
  return (
    !sessionId ||
    !('class_lesson_plan_uuid' in schedule) ||
    !schedule.class_lesson_plan_uuid ||
    schedule.class_lesson_plan_uuid === sessionId
  );
}

// Quiz grading deadlines are returned by the API but absent from the generated quiz type.
export function gradingDeadline(schedule?: object) {
  if (!schedule || !('grading_due_at' in schedule)) return undefined;
  const value = schedule.grading_due_at;
  return value instanceof Date ? value : typeof value === 'string' ? new Date(value) : undefined;
}
