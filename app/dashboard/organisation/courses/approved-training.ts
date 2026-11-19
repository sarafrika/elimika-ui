import type { CourseTrainingApplication, ProgramTrainingApplication } from '@/services/client';

/** Only this organisation's current approvals belong on its training list. */
export function approvedTrainingItems(
  organisationUuid: string,
  courses: CourseTrainingApplication[],
  programs: ProgramTrainingApplication[]
) {
  const entries = [
    ...courses.map(application => ({
      kind: 'course' as const,
      uuid: application.course_uuid,
      application,
    })),
    ...programs.map(application => ({
      kind: 'program' as const,
      uuid: application.program_uuid,
      application,
    })),
  ];
  const approved = entries.flatMap(({ kind, uuid, application }) =>
    organisationUuid &&
    uuid &&
    application.applicant_uuid === organisationUuid &&
    application.applicant_type === 'organisation' &&
    application.status === 'approved'
      ? [{ kind, uuid, application }]
      : []
  );
  return Array.from(
    new Map(approved.map(entry => [`${entry.kind}:${entry.uuid}`, entry])).values()
  );
}

export function approvedTrainingDetailsHref(kind: 'course' | 'program', uuid: string) {
  const base = '/dashboard/organisation/courses';
  return `${base}/${kind === 'program' ? 'available-programs/' : ''}${encodeURIComponent(uuid)}`;
}

export function approvedTrainingPrefill(kind: 'course' | 'program', uuid: string) {
  return kind === 'program' ? { programUuid: uuid } : { courseUuid: uuid };
}
