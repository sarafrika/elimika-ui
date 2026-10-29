import type { TrainingProgram } from '@/services/client/types.gen';
import {
  defaultProgramValues,
  programBody,
  type ProgramFormValues,
  programRequirementTypeSchema,
} from './program-schema';

export type ProgramSaveStep = number | 'requirements' | 'all';

export type ProgramSaveProgress = {
  steps: { key: string; label: string }[];
  currentStep: string;
};

/** Only copy content owned by this step; unfinished fields on other steps stay local. */
export function programStepBody(
  values: ProgramFormValues,
  creatorUuid: string,
  existing: TrainingProgram | undefined,
  step: ProgramSaveStep
) {
  const saved = defaultProgramValues(existing);
  return programBody(
    {
      ...saved,
      ...(step === 0 || step === 'all'
        ? {
            title: values.title,
            programCode: values.programCode,
            categoryUuids: values.categoryUuids,
            description: values.description,
            objectives: values.objectives,
            prerequisites: values.prerequisites,
            classLimit: values.classLimit,
          }
        : {}),
      ...(step === 2 || step === 'all' ? { passMark: values.passMark } : {}),
      ...(step === 5 || step === 'all' ? { price: values.price } : {}),
    },
    creatorUuid,
    existing
  );
}

export function requirementBody(row: ProgramFormValues['requirements'][number]) {
  return {
    requirement_type: programRequirementTypeSchema.parse(row.requirementType),
    requirement_text: row.requirementText.trim(),
    is_mandatory: row.isMandatory,
  };
}

export function courseBody(row: ProgramFormValues['courses'][number], index: number) {
  return {
    course_uuid: row.courseUuid,
    sequence_order: index + 1,
    is_required: row.isRequired,
    prerequisite_course_uuid: row.prerequisiteCourseUuid || null,
  };
}

/** The weights endpoint body; empty when nothing is weighted yet, so drafts can skip it. */
export function courseWeightsBody(courses: ProgramFormValues['courses']) {
  if (!courses.some(course => course.isRequired && course.weightPercentage.trim() !== '')) return [];
  return courses.map(course => ({
    program_course_uuid: course.associationUuid ?? '',
    is_required: course.isRequired,
    weight_percentage: course.isRequired ? Number(course.weightPercentage) : undefined,
  }));
}

/** Compare the API payload, so UI metadata and harmless numeric/whitespace edits do not save. */
export function sameProgramPayload(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function changedProgramRows<T>(
  saved: Map<string, unknown>,
  rows: T[],
  id: (row: T) => string | undefined,
  body: (row: T, index: number) => unknown
) {
  const current = new Set(rows.map(id).filter(Boolean));
  return (
    [...saved.keys()].some(uuid => !current.has(uuid)) ||
    rows.some((row, index) => {
      const uuid = id(row);
      return !uuid || !sameProgramPayload(saved.get(uuid), body(row, index));
    })
  );
}
