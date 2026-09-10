import type { CourseTrainingApplication } from '@/services/client';

export function groupInstructorCourses(
  applications: CourseTrainingApplication[],
  instructorUuid?: string
) {
  const groups = new Map<string, Set<string>>();
  for (const application of applications) {
    const { applicant_uuid, course_uuid } = application;
    if (
      application.applicant_type !== 'instructor' ||
      application.status !== 'approved' ||
      !applicant_uuid ||
      !course_uuid ||
      (instructorUuid && applicant_uuid !== instructorUuid)
    )
      continue;
    const courses = groups.get(applicant_uuid) ?? new Set<string>();
    courses.add(course_uuid);
    groups.set(applicant_uuid, courses);
  }
  return Array.from(groups, ([uuid, courses]) => ({ uuid, courseIds: [...courses] }));
}
