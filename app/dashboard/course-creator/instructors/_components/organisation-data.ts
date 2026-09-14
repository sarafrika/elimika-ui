import type {
  ClassDefinition,
  ClassDefinitionResponse,
  CourseTrainingApplication,
} from '@/services/client';

export function groupApprovedOrganisationCourses(
  applications: CourseTrainingApplication[],
  organisationUuid?: string
) {
  const groups = new Map<string, Set<string>>();
  for (const application of applications) {
    const { applicant_uuid, course_uuid } = application;
    if (
      application.applicant_type !== 'organisation' ||
      application.status !== 'approved' ||
      !applicant_uuid ||
      !course_uuid ||
      (organisationUuid && applicant_uuid !== organisationUuid)
    )
      continue;
    const courses = groups.get(applicant_uuid) ?? new Set<string>();
    courses.add(course_uuid);
    groups.set(applicant_uuid, courses);
  }
  return Array.from(groups, ([uuid, courses]) => ({ uuid, courseIds: [...courses] }));
}

// Only classes owned by this organisation on the creator's approved courses
// establish an instructor attachment. Organisation membership alone does not.
export function organisationCourseInstructors(
  responses: ClassDefinitionResponse[],
  organisationUuid: string,
  courseIds: string[]
) {
  const courses = new Set(courseIds);
  const result = new Map<string, Map<string, ClassDefinition[]>>();
  for (const { class_definition: definition } of responses) {
    if (
      !definition?.course_uuid ||
      !courses.has(definition.course_uuid) ||
      definition.organisation_uuid !== organisationUuid ||
      !definition.default_instructor_uuid
    )
      continue;
    const instructors = result.get(definition.course_uuid) ?? new Map<string, ClassDefinition[]>();
    const classes = instructors.get(definition.default_instructor_uuid) ?? [];
    if (!classes.some(item => item.uuid && item.uuid === definition.uuid)) classes.push(definition);
    instructors.set(definition.default_instructor_uuid, classes);
    result.set(definition.course_uuid, instructors);
  }
  return result;
}
