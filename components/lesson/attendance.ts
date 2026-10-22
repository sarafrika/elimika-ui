import type { Enrollment } from '@/services/client/types.gen';

/** The API's derived flags are optional; preserve the saved status when they are absent. */
export function enrollmentAttendanceStatus(enrollment: Enrollment) {
  if (enrollment.status === 'ATTENDED') return 'PRESENT';
  if (enrollment.status === 'ABSENT') return 'ABSENT';
  if (enrollment.did_attend === true) return 'PRESENT';
  if (enrollment.is_attendance_marked && enrollment.did_attend === false) return 'ABSENT';
  return 'UNMARKED';
}
