import type { CourseRubricAssociation, PageMetadata } from '@/services/client/types.gen';

export const COURSE_EVALUATION_CONTEXT = 'course-evaluation';

// Contexts keep each lesson/component association independent, even when it shares a rubric.
export function lessonEvaluationContext(assessmentUuid: string, lessonUuid: string) {
  return `assessment:${assessmentUuid}:lesson:${lessonUuid}`;
}

export function resolveEvaluationRubric(
  componentRubric: string | null | undefined,
  lessonRubric: string | null | undefined,
  courseRubric: string | null | undefined
) {
  return componentRubric || lessonRubric || courseRubric || null;
}

export function getCourseEvaluationAssociation(associations: CourseRubricAssociation[]) {
  return (
    associations.find(item => item.usage_context === COURSE_EVALUATION_CONTEXT) ??
    associations.find(item => item.is_primary_rubric)
  );
}

export function nextEvaluationPage(metadata: PageMetadata | undefined, currentPage: number) {
  if (metadata?.hasNext === false || metadata?.last === true) return undefined;
  if (metadata?.hasNext || (metadata?.totalPages ?? 0) > currentPage + 1) {
    return currentPage + 1;
  }
  return undefined;
}

export function assertEvaluationResponse(
  response: { success?: boolean; error?: unknown; message?: string } | undefined
) {
  if (!response || response.error || response.success === false) {
    throw new Error(response?.message || 'Unable to save the rubric. Please try again.');
  }
}

// Use association updates and context-specific removals: one rubric may be used in many cells.
type AssociationResponse = { success?: boolean; error?: unknown; message?: string } | undefined;
type AssociationWriter = {
  associate: (input: {
    path: { courseUuid: string };
    body: CourseRubricAssociation;
  }) => Promise<AssociationResponse>;
  update: (input: {
    path: { courseUuid: string; associationUuid: string };
    body: CourseRubricAssociation;
  }) => Promise<AssociationResponse>;
  remove: (input: {
    path: { courseUuid: string; rubricUuid: string; context: string };
  }) => Promise<AssociationResponse>;
};

export async function persistEvaluationAssociation(
  {
    courseUuid,
    associatedBy,
    context,
    existing,
    rubricUuid,
    primary = false,
  }: {
    courseUuid: string;
    associatedBy?: string;
    context: string;
    existing?: CourseRubricAssociation;
    rubricUuid: string | null;
    primary?: boolean;
  },
  writer: AssociationWriter
) {
  if (!courseUuid) throw new Error('Save the course details before attaching rubrics.');
  if ((existing?.rubric_uuid ?? null) === rubricUuid) return;
  if (!rubricUuid) {
    if (!existing) return;
    if (existing.usage_context === context) {
      assertEvaluationResponse(
        await writer.remove({
          path: {
            courseUuid,
            rubricUuid: existing.rubric_uuid,
            context,
          },
        })
      );
    } else if (primary && existing.uuid) {
      // Keep legacy associations in their original context when removing their primary role.
      assertEvaluationResponse(
        await writer.update({
          path: { courseUuid, associationUuid: existing.uuid },
          body: { ...existing, is_primary_rubric: false },
        })
      );
    } else {
      throw new Error('This rubric association cannot be changed. Please reload the course.');
    }
    return;
  }
  const actor = existing?.associated_by || associatedBy;
  if (!actor) throw new Error('Your profile is still loading. Please try again.');
  const body: CourseRubricAssociation = {
    course_uuid: courseUuid,
    rubric_uuid: rubricUuid,
    associated_by: actor,
    usage_context: existing?.usage_context || context,
    is_primary_rubric: primary || existing?.is_primary_rubric || false,
  };
  if (existing) {
    if (!existing.uuid)
      throw new Error('This rubric association cannot be changed. Please reload the course.');
    assertEvaluationResponse(
      await writer.update({ path: { courseUuid, associationUuid: existing.uuid }, body })
    );
  } else {
    assertEvaluationResponse(await writer.associate({ path: { courseUuid }, body }));
  }
}
