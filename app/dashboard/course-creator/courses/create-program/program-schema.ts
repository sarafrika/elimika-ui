import { z } from 'zod';
import { passMarkSchema, toPassMark } from '@/lib/pass-mark';
import { RequirementTypeEnum, type TrainingProgram } from '@/services/client/types.gen';

const optionalPrice = z
  .string()
  .trim()
  .refine(
    value => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0),
    'Enter a price of zero or greater'
  );

export const programDraftSchema = z.object({
  programCode: z.string().default(''),
  subject: z.string().default(''),
  award: z.string().default(''),
  rubric: z.string().default(''),
  evaluationNotes: z.string().default(''),
  evaluationCriteria: z.record(z.string()).default({}),
  assessments: z
    .array(
      z.object({
        name: z.string(),
        weight: z.string(),
        criteria: z.string(),
      })
    )
    .default([]),
  brandName: z.string().default(''),
  tagline: z.string().default(''),
  logoUrl: z.string().default(''),
  coverUrl: z.string().default(''),
  thumbnailUrl: z.string().default(''),
  bannerUrl: z.string().default(''),
  videoUrl: z.string().default(''),
  hourlyFee: z.string().default(''),
  instructorShare: z.string().default(''),
  creatorShare: z.string().default(''),
});

export const programFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Program title is required'),
    programCode: z.string().trim().default(''),
    passMark: passMarkSchema.default(''),
    thumbnailUrl: z.string().default(''),
    bannerUrl: z.string().default(''),
    videoUrl: z.string().default(''),
    categoryUuids: z.array(z.string().min(1)).min(1, 'Select at least one category'),
    draft: programDraftSchema,
    description: z.string().trim().min(1, 'Describe the program'),
    objectives: z.string().trim(),
    prerequisites: z.string().trim(),
    classLimit: z
      .string()
      .trim()
      .refine(
        value => value !== '' && Number.isInteger(Number(value)) && Number(value) >= 1,
        'Class limit must be a whole number of at least 1'
      ),
    totalDurationHours: z.coerce.number().int().min(0, 'Hours cannot be negative'),
    totalDurationMinutes: z.coerce
      .number()
      .int()
      .min(0)
      .max(59, 'Minutes must be between 0 and 59'),
    price: optionalPrice,
    requirements: z.array(
      z.object({
        uuid: z.string().optional(),
        requirementText: z.string().trim().min(1, 'Enter a requirement or remove this row'),
        requirementType: z.nativeEnum(RequirementTypeEnum),
        isMandatory: z.boolean(),
      })
    ),
    courses: z.array(
      z.object({
        associationUuid: z.string().optional(),
        courseUuid: z.string().min(1),
        isRequired: z.boolean(),
        prerequisiteCourseUuid: z.string(),
      })
    ),
  })
  .superRefine((values, ctx) => {
    const seen = new Set<string>();
    values.courses.forEach((course, index) => {
      if (seen.has(course.courseUuid)) {
        ctx.addIssue({
          code: 'custom',
          path: ['courses', index, 'courseUuid'],
          message: 'Course is already selected',
        });
      }
      if (course.prerequisiteCourseUuid && !seen.has(course.prerequisiteCourseUuid)) {
        ctx.addIssue({
          code: 'custom',
          path: ['courses', index, 'prerequisiteCourseUuid'],
          message: 'Choose a prerequisite earlier in the curriculum',
        });
      }
      seen.add(course.courseUuid);
    });
  });

export type ProgramFormValues = z.infer<typeof programFormSchema>;

export function defaultProgramValues(program?: TrainingProgram): ProgramFormValues {
  return {
    title: program?.title ?? '',
    programCode: program?.program_code ?? '',
    passMark: program?.pass_mark ?? '',
    thumbnailUrl: program?.thumbnail_url ?? '',
    bannerUrl: program?.banner_url ?? '',
    videoUrl: program?.intro_video_url ?? '',
    categoryUuids: program?.category_uuid ? [program.category_uuid] : [],
    draft: programDraftSchema.parse({}),
    description: program?.description ?? '',
    objectives: program?.objectives ?? '',
    prerequisites: program?.prerequisites ?? '',
    classLimit: String(program?.class_limit ?? 1),
    totalDurationHours: program?.total_duration_hours ?? 0,
    totalDurationMinutes: program?.total_duration_minutes ?? 0,
    price: program?.price == null ? '' : String(program.price),
    requirements: [],
    courses: [],
  };
}

/**
 * The program's content. Lifecycle (`status`, `published`, `active`) is changed only
 * through the publish, unpublish and archive endpoints: the generated type still lists
 * those fields, so they are filled from the loaded record and stripped when the body is
 * serialized (`withoutProgramLifecycle`).
 */
export function programBody(
  values: ProgramFormValues,
  creatorUuid: string,
  existing?: TrainingProgram
): TrainingProgram {
  return {
    title: values.title.trim(),
    program_code: values.programCode.trim().toUpperCase() || null,
    pass_mark: toPassMark(values.passMark),
    course_creator_uuid: existing?.course_creator_uuid ?? creatorUuid,
    category_uuid: values.categoryUuids[0],
    description: values.description.trim(),
    objectives: values.objectives.trim(),
    prerequisites: values.prerequisites.trim(),
    total_duration_hours: values.totalDurationHours,
    total_duration_minutes: values.totalDurationMinutes,
    class_limit: Number(values.classLimit),
    price: values.price.trim() === '' ? null : Number(values.price),
    status: existing?.status ?? 'draft',
    active: existing?.active ?? false,
    published: existing?.published ?? false,
  };
}

export function assertProgramResponse(response: unknown, fallback: string): void {
  if (typeof response !== 'object' || response === null) return;
  if (
    ('error' in response && response.error) ||
    ('success' in response && response.success === false)
  ) {
    throw new Error(
      'message' in response && typeof response.message === 'string' ? response.message : fallback
    );
  }
}
