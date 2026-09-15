import type { InstructorClassWithSchedule } from '@/hooks/use-instructor-classes-with-schedules';

export const ACTIVE_ENROLLMENT_STATUSES = new Set(['ENROLLED', 'ATTENDED', 'ABSENT']);

type CourseClassEnrollments = Pick<
  InstructorClassWithSchedule,
  'course_uuid' | 'course' | 'enrollments'
>;

export function summarizeCourseEnrollments(classes: readonly CourseClassEnrollments[]) {
  const studentsByCourse = new Map<string, Set<string>>();
  const allStudents = new Set<string>();

  for (const cls of classes) {
    const courseId = cls.course_uuid || cls.course?.uuid;
    const courseStudents = courseId ? (studentsByCourse.get(courseId) ?? new Set<string>()) : null;

    for (const enrollment of cls.enrollments) {
      if (!enrollment.student_uuid || !ACTIVE_ENROLLMENT_STATUSES.has(enrollment.status ?? '')) {
        continue;
      }

      allStudents.add(enrollment.student_uuid);
      courseStudents?.add(enrollment.student_uuid);
    }

    if (courseId && courseStudents) studentsByCourse.set(courseId, courseStudents);
  }

  return { studentsByCourse, totalStudents: allStudents.size };
}
