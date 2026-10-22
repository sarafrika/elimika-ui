import type { ClassDefinition, Enrollment, ScheduledInstance } from '@/services/client';

export type RosterScope = 'all' | 'active';

type RosterClass = Pick<ClassDefinition, 'is_active' | 'class_progress_percentage'> & {
  schedule:
    | Pick<ScheduledInstance, 'uuid' | 'status' | 'concluded_at' | 'start_time' | 'end_time'>[]
    | null;
  enrollment: Enrollment[] | null;
};

const ENROLLED_STATUSES = new Set(['ENROLLED', 'ATTENDED', 'ABSENT']);

export function isEnrolledStudent(enrollment: Enrollment) {
  return ENROLLED_STATUSES.has(enrollment.status ?? '');
}

export function isActiveClass(classItem: RosterClass, now: number) {
  if (classItem.is_active === false || (classItem.class_progress_percentage ?? 0) >= 100) {
    return false;
  }

  const sessions = (classItem.schedule ?? []).filter(
    session => session.status !== 'CANCELLED' && session.status !== 'BLOCKED'
  );
  if (sessions.length === 0) return false;
  if (sessions.every(session => session.status === 'COMPLETED' || session.concluded_at)) {
    return false;
  }

  const starts = sessions.map(session => new Date(session.start_time).getTime());
  const ends = sessions.map(session => new Date(session.end_time).getTime());
  return Math.min(...starts) <= now && Math.max(...ends) >= now;
}

export function filterRosterClasses<T extends RosterClass>(
  classes: T[],
  scope: RosterScope,
  now = Date.now()
): T[] {
  return classes
    .filter(classItem => scope === 'all' || isActiveClass(classItem, now))
    .map(classItem => ({
      ...classItem,
      enrollment: (classItem.enrollment ?? []).filter(enrollment => {
        if (!isEnrolledStudent(enrollment)) return false;
        if (scope === 'all') return true;
        if (enrollment.is_active === false) return false;

        return (classItem.schedule ?? []).some(
          session =>
            session.uuid === enrollment.scheduled_instance_uuid &&
            session.status !== 'CANCELLED' &&
            session.status !== 'BLOCKED' &&
            session.status !== 'COMPLETED' &&
            !session.concluded_at &&
            new Date(session.end_time).getTime() >= now
        );
      }),
    }));
}
