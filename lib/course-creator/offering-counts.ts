import type {
  ClassDefinition,
  CourseTrainingApplication,
  PageMetadata,
  ProgramTrainingApplication,
} from '@/services/client';

export type OfferingReference = { type: 'courses' | 'programs'; uuid: string };

type TrainingApplication = CourseTrainingApplication | ProgramTrainingApplication;

/** Count each instructor and organisation once across classes and approvals. */
export function countOfferingTrainers(
  offering: OfferingReference,
  classes: ClassDefinition[],
  applications: TrainingApplication[]
) {
  const instructors = new Set<string>();
  const organisations = new Set<string>();

  for (const definition of classes) {
    const uuid = offering.type === 'courses' ? definition.course_uuid : definition.program_uuid;
    if (uuid !== offering.uuid) continue;
    if (definition.default_instructor_uuid) instructors.add(definition.default_instructor_uuid);
    if (definition.organisation_uuid) organisations.add(definition.organisation_uuid);
  }

  for (const application of applications) {
    const uuid =
      offering.type === 'courses'
        ? 'course_uuid' in application && application.course_uuid
        : 'program_uuid' in application && application.program_uuid;
    if (uuid !== offering.uuid || application.status !== 'approved') continue;
    if (!application.applicant_uuid) continue;
    if (application.applicant_type === 'instructor') instructors.add(application.applicant_uuid);
    if (application.applicant_type === 'organisation')
      organisations.add(application.applicant_uuid);
  }

  return {
    instructors: instructors.size,
    organisations: organisations.size,
    total: instructors.size + organisations.size,
  };
}

/** A partial roster must never be mistaken for its enrollment total. */
export function enrollmentTotal(metadata: PageMetadata | undefined): number | undefined {
  if (metadata?.totalElements == null) return undefined;
  const total = Number(metadata.totalElements);
  return Number.isSafeInteger(total) && total >= 0 ? total : undefined;
}
