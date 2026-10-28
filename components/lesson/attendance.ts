import type { Enrollment } from '@/services/client/types.gen';

export type RegisterMark = 'ATTENDED' | 'ABSENT' | 'EXCUSED';

/** The API's derived flags are optional; preserve the saved status when they are absent. */
export function enrollmentAttendanceStatus(enrollment: Enrollment) {
  // The client's status enum predates EXCUSED; the API sends it as a plain string.
  const status = String(enrollment.status ?? '').toUpperCase();
  if (status === 'ATTENDED') return 'PRESENT';
  if (status === 'ABSENT') return 'ABSENT';
  if (status === 'EXCUSED') return 'EXCUSED';
  if (enrollment.did_attend === true) return 'PRESENT';
  if (enrollment.is_attendance_marked && enrollment.did_attend === false) return 'ABSENT';
  return 'UNMARKED';
}

/** The register mark an enrollment already carries, for re-saving its notes unchanged. */
export function registerMarkOf(enrollment: Enrollment): RegisterMark | undefined {
  const status = enrollmentAttendanceStatus(enrollment);
  if (status === 'PRESENT') return 'ATTENDED';
  if (status === 'ABSENT') return 'ABSENT';
  if (status === 'EXCUSED') return 'EXCUSED';
  return undefined;
}
