import type {
  CourseTrainingApplication,
  PageMetadata,
  ProgramTrainingApplication,
} from '@/services/client';

export function groupInstructorOfferings(
  applications: CourseTrainingApplication[],
  programApplications: ProgramTrainingApplication[],
  instructorUuid?: string
) {
  const groups = new Map<
    string,
    { uuid: string; courseIds: Set<string>; programIds: Set<string> }
  >();
  for (const application of [...applications, ...programApplications]) {
    const { applicant_uuid } = application;
    const courseUuid = 'course_uuid' in application ? application.course_uuid : undefined;
    const programUuid = 'program_uuid' in application ? application.program_uuid : undefined;
    if (
      application.applicant_type !== 'instructor' ||
      application.status !== 'approved' ||
      !applicant_uuid ||
      (!courseUuid && !programUuid) ||
      (instructorUuid && applicant_uuid !== instructorUuid)
    )
      continue;
    const group = groups.get(applicant_uuid) ?? {
      uuid: applicant_uuid,
      courseIds: new Set<string>(),
      programIds: new Set<string>(),
    };
    if (courseUuid) group.courseIds.add(courseUuid);
    if (programUuid) group.programIds.add(programUuid);
    groups.set(applicant_uuid, group);
  }
  return Array.from(groups.values(), group => ({
    uuid: group.uuid,
    courseIds: [...group.courseIds],
    programIds: [...group.programIds],
  }));
}

export type InstructorOffering = {
  uuid: string;
  kind: 'course' | 'program';
  name: string | null;
  creatorShare?: number | null;
  instructorShare?: number | null;
};

export function nextInstructorPage(
  response: {
    error?: unknown;
    success?: boolean;
    data?: { metadata?: PageMetadata; content?: unknown[] };
  },
  loadedPages: number,
  pageSize: number
) {
  if (response.error || response.success === false) return undefined;
  const metadata = response.data?.metadata;
  const next = (metadata?.pageNumber ?? loadedPages - 1) + 1;
  const hasNext =
    metadata?.hasNext ??
    (metadata?.last != null
      ? !metadata.last
      : metadata?.totalPages != null
        ? next < metadata.totalPages
        : (response.data?.content?.length ?? 0) === pageSize);
  return hasNext ? next : undefined;
}
