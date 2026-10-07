import type { ScheduledInstance } from '@/services/client/types.gen';

export const AUTOMATIC_LESSON = 'automatic';

export function assignedLesson(session: ScheduledInstance) {
  // The generated schema currently omits the assignment returned by the API.
  return 'lesson_uuid' in session && typeof session.lesson_uuid === 'string' && session.lesson_uuid
    ? session.lesson_uuid
    : AUTOMATIC_LESSON;
}

export function canEditLesson(session: ScheduledInstance, now = Date.now()) {
  return (
    new Date(session.start_time).getTime() > now &&
    !session.started_at &&
    !session.concluded_at &&
    (!session.status || session.status === 'SCHEDULED')
  );
}
