import { enrollmentAttendanceStatus } from '@/components/lesson/attendance';
import { parseApiDate } from '@/lib/date';
import type { Enrollment, ScheduledInstance } from '@/services/client/types.gen';

export type AttendanceMark = ReturnType<typeof enrollmentAttendanceStatus>;
export type AttendanceSession = ScheduledInstance & { uuid: string };
export type AttendanceTotals = { present: number; absent: number; unmarked: number };
export type ClassAttendanceMatrix = {
  sessions: AttendanceSession[];
  studentIds: string[];
  marks: Map<string, Map<string, AttendanceMark>>;
  totals: AttendanceTotals;
};

function savedAt(enrollment: Enrollment) {
  return (
    parseApiDate(
      enrollment.updated_date ?? enrollment.attendance_marked_at ?? enrollment.created_date
    )?.valueOf() ?? 0
  );
}

function attendanceMark(enrollment: Enrollment): AttendanceMark {
  // Some API responses use lowercase statuses despite the generated enum.
  if (enrollment.status?.toUpperCase() === 'ATTENDED') return 'PRESENT';
  if (enrollment.status?.toUpperCase() === 'ABSENT') return 'ABSENT';
  return enrollmentAttendanceStatus(enrollment);
}

export function buildClassAttendance(
  classId: string,
  instances: ScheduledInstance[],
  enrollments: Enrollment[]
): ClassAttendanceMatrix {
  const sessions = [
    ...new Map(
      instances
        .filter((session): session is AttendanceSession =>
          Boolean(
            session.uuid &&
              session.class_definition_uuid === classId &&
              !['CANCELLED', 'BLOCKED'].includes(session.status?.toUpperCase() ?? '')
          )
        )
        .map(session => [session.uuid, session])
    ).values(),
  ].sort(
    (a, b) =>
      (parseApiDate(a.start_time)?.valueOf() ?? 0) - (parseApiDate(b.start_time)?.valueOf() ?? 0)
  );
  const sessionIds = new Set(sessions.map(session => session.uuid));
  const records = new Map<string, Enrollment>();
  for (const enrollment of enrollments) {
    if (!enrollment.student_uuid || !sessionIds.has(enrollment.scheduled_instance_uuid)) continue;
    if (
      enrollment.status &&
      !['ENROLLED', 'ATTENDED', 'ABSENT'].includes(enrollment.status.toUpperCase())
    )
      continue;
    const key = `${enrollment.student_uuid}:${enrollment.scheduled_instance_uuid}`;
    const previous = records.get(key);
    if (
      !previous ||
      savedAt(enrollment) > savedAt(previous) ||
      (savedAt(enrollment) === savedAt(previous) && attendanceMark(previous) === 'UNMARKED')
    ) {
      records.set(key, enrollment);
    }
  }
  const marks = new Map<string, Map<string, AttendanceMark>>();
  const totals: AttendanceTotals = { present: 0, absent: 0, unmarked: 0 };
  for (const enrollment of records.values()) {
    const mark = attendanceMark(enrollment);
    const studentMarks = marks.get(enrollment.student_uuid) ?? new Map<string, AttendanceMark>();
    studentMarks.set(enrollment.scheduled_instance_uuid, mark);
    marks.set(enrollment.student_uuid, studentMarks);
    if (mark === 'PRESENT') totals.present++;
    else if (mark === 'ABSENT') totals.absent++;
    else totals.unmarked++;
  }
  return { sessions, studentIds: [...marks.keys()].sort(), marks, totals };
}
