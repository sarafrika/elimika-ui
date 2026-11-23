import { queryOptions } from '@tanstack/react-query';
import { readProgramRequirementText, writeRequirementText } from '@/lib/program-requirements';
import { STALE_TIMES } from '@/lib/query-client';
import {
  addCourseRequirement,
  addCourseTrainingRequirement,
  deleteCourseRequirement,
  deleteCourseTrainingRequirement,
  getCourseRequirements,
  updateCourseRequirement,
  updateCourseTrainingRequirement,
} from '@/services/client';
import { getCourseRequirementsQueryKey } from '@/services/client/@tanstack/react-query.gen';
import type {
  CourseRequirement,
  CourseTrainingRequirement,
  CourseTrainingRequirementWritable,
} from '@/services/client/types.gen';

export type CourseRequirementRecord = Omit<CourseTrainingRequirement, 'requirement_type'> & {
  requirement_type: string;
  storage?: 'participation';
};

function educationRecord(row: CourseRequirement, courseUuid: string): CourseRequirementRecord {
  const entry = readProgramRequirementText(row.requirement_text);
  return {
    ...row,
    ...entry,
    course_uuid: courseUuid,
    provided_by: 'instructor',
    quantity: 1,
    unit: 'license',
    is_mandatory: row.is_mandatory,
    storage: 'participation',
  };
}

/** Education uses provider-based participation requirements, just as programs do. */
export function courseEducationRequirementsOptions(courseUuid?: string) {
  return queryOptions({
    queryKey: courseUuid
      ? getCourseRequirementsQueryKey({ path: { courseUuid }, query: { pageable: {} } })
      : [],
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
    queryFn: async ({ signal }) => {
      if (!courseUuid) throw new Error('A course is required to load education requirements.');
      const content: CourseRequirement[] = [];
      for (let page = 0; ; page += 1) {
        const { data, error } = await getCourseRequirements({
          path: { courseUuid },
          query: { pageable: { page, size: 100 } },
          signal,
        });
        if (error) throw error;
        if (!data || data.error || data.success === false) {
          throw new Error(data?.message || 'Failed to load education requirements.');
        }
        const rows = data.data?.content ?? [];
        content.push(...rows);
        const metadata = data.data?.metadata;
        const hasNext =
          metadata?.hasNext ??
          (metadata?.last !== undefined
            ? !metadata.last
            : metadata?.totalPages !== undefined
              ? page + 1 < metadata.totalPages
              : metadata?.totalElements !== undefined
                ? (page + 1) * 100 < Number(metadata.totalElements)
                : rows.length === 100);
        if (!hasNext || rows.length === 0) {
          return { ...data, data: { ...data.data, content } };
        }
      }
    },
    select: response =>
      (response.data?.content ?? [])
        .filter(row =>
          row.requirement_type === 'INSTRUCTOR' &&
          readProgramRequirementText(row.requirement_text).requirement_type === 'education'
        )
        .map(row => educationRecord(row, courseUuid ?? '')),
  });
}

function confirmedData<T>(response: {
  data?: T;
  error?: unknown;
  success?: boolean;
  message?: string;
}): T {
  if (response.error || response.success === false || !response.data) {
    throw new Error(response.message || 'The requirement was not confirmed by the server.');
  }
  return response.data;
}

export async function removeCourseRequirement({
  courseUuid,
  requirement,
}: {
  courseUuid: string;
  requirement: CourseRequirementRecord;
}) {
  if (!requirement.uuid) throw new Error('A saved requirement is required.');
  const options = { path: { courseUuid, requirementUuid: requirement.uuid } };
  const { data, error } = requirement.storage === 'participation'
    ? await deleteCourseRequirement(options)
    : await deleteCourseTrainingRequirement(options);
  if (error) throw error;
  if (
    typeof data === 'object' &&
    data !== null &&
    (('error' in data && data.error) || ('success' in data && data.success === false))
  ) {
    throw new Error(
      'message' in data && typeof data.message === 'string' && data.message
        ? data.message
        : 'Failed to delete requirement.'
    );
  }
}

export async function saveCourseRequirement({
  courseUuid,
  requirement,
  existing,
}: {
  courseUuid: string;
  requirement: CourseRequirementRecord;
  existing?: CourseRequirementRecord;
}): Promise<CourseRequirementRecord> {
  const education = requirement.requirement_type === 'education';
  const sameStorage = education === (existing?.storage === 'participation');
  const requirementUuid = sameStorage ? existing?.uuid : undefined;
  let saved: CourseRequirementRecord;
  if (education) {
    if (requirement.provided_by !== 'instructor') {
      throw new Error('Education requirements must be provided by an instructor.');
    }
    const body = {
      requirement_type: 'INSTRUCTOR' as const,
      requirement_text: writeRequirementText({ ...requirement, quantity: '1', unit: 'license' }),
      is_mandatory: requirement.is_mandatory,
    };
    const { data, error } = requirementUuid
      ? await updateCourseRequirement({ path: { courseUuid, requirementUuid }, body })
      : await addCourseRequirement({ path: { courseUuid }, body });
    if (error) throw error;
    if (!data) throw new Error('Failed to save education requirement.');
    saved = educationRecord(confirmedData(data), courseUuid);
  } else {
    const type = requirement.requirement_type;
    if (type !== 'material' && type !== 'equipment' && type !== 'facility' && type !== 'other') {
      throw new Error('Unsupported training requirement type.');
    }
    const body: CourseTrainingRequirementWritable = {
      course_uuid: courseUuid,
      name: requirement.name.trim(),
      requirement_type: type,
      quantity: requirement.quantity,
      unit: requirement.unit,
      description: requirement.description,
      provided_by: requirement.provided_by,
      is_mandatory: requirement.is_mandatory,
    };
    const { data, error } = requirementUuid
      ? await updateCourseTrainingRequirement({ path: { courseUuid, requirementUuid }, body })
      : await addCourseTrainingRequirement({ path: { courseUuid }, body });
    if (error) throw error;
    if (!data) throw new Error('Failed to save training requirement.');
    saved = confirmedData(data);
  }
  if (!saved.uuid) throw new Error('The server did not confirm a requirement identifier.');
  // Changing type moves the row between the two APIs; keep the old row until the new one is saved.
  if (existing?.uuid && !sameStorage) {
    await removeCourseRequirement({ courseUuid, requirement: existing });
  }
  return saved;
}
