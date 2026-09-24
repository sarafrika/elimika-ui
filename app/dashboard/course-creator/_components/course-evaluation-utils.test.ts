import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { CourseRubricAssociation } from '@/services/client/types.gen';
import {
  assertEvaluationResponse,
  COURSE_EVALUATION_CONTEXT,
  getCourseEvaluationAssociation,
  lessonEvaluationContext,
  nextEvaluationPage,
  persistEvaluationAssociation,
  resolveEvaluationRubric,
} from './course-evaluation-utils';

test('whole-course assessment rubric takes precedence without losing a lesson choice', () => {
  const lessonRubric = 'lesson-rubric';
  assert.equal(
    resolveEvaluationRubric('component-rubric', lessonRubric, 'course-rubric'),
    'component-rubric'
  );
  assert.equal(resolveEvaluationRubric(null, lessonRubric, 'course-rubric'), lessonRubric);
  assert.equal(resolveEvaluationRubric(null, null, 'course-rubric'), 'course-rubric');
  assert.equal(resolveEvaluationRubric(null, null, null), null);
});

test('contexts distinguish lessons and assessment components', () => {
  const contexts = ['assessment-a', 'assessment-b'].flatMap(assessment =>
    ['lesson-a', 'lesson-b'].map(lesson => lessonEvaluationContext(assessment, lesson))
  );
  assert.equal(new Set(contexts).size, 4);
});

const association: CourseRubricAssociation = {
  uuid: 'association-a',
  course_uuid: 'course',
  rubric_uuid: 'shared-rubric',
  associated_by: 'creator',
  usage_context: lessonEvaluationContext('assessment-a', 'lesson-a'),
};

test('changing one cell updates its association; clearing it removes only that context', async () => {
  const other = {
    ...association,
    uuid: 'association-b',
    usage_context: lessonEvaluationContext('assessment-a', 'lesson-b'),
  };
  const stored = new Map([
    [association.uuid!, association],
    [other.uuid, other],
  ]);
  const writer = {
    associate: async () => {
      throw new Error('A replacement must update the existing association');
    },
    update: async (input: { path: { associationUuid: string }; body: CourseRubricAssociation }) => {
      stored.set(input.path.associationUuid, { ...input.body, uuid: input.path.associationUuid });
      return { success: true };
    },
    remove: async (input: {
      path: { courseUuid: string; rubricUuid: string; context: string };
    }) => {
      for (const [id, item] of stored) {
        if (
          item.course_uuid === input.path.courseUuid &&
          item.rubric_uuid === input.path.rubricUuid &&
          item.usage_context === input.path.context
        )
          stored.delete(id);
      }
      return { success: true };
    },
  };
  const context = association.usage_context!;
  await persistEvaluationAssociation(
    { courseUuid: 'course', context, existing: association, rubricUuid: 'new-rubric' },
    writer
  );
  assert.equal(stored.get('association-a')?.rubric_uuid, 'new-rubric');
  assert.equal(stored.get('association-b')?.rubric_uuid, 'shared-rubric');
  await persistEvaluationAssociation(
    { courseUuid: 'course', context, existing: stored.get('association-a'), rubricUuid: null },
    writer
  );
  assert.equal(stored.has('association-a'), false);
  assert.deepEqual(stored.get('association-b'), other);
});

test('removing a legacy primary rubric preserves its original usage association', async () => {
  const legacy = { ...association, is_primary_rubric: true, usage_context: 'midterm' };
  let saved: CourseRubricAssociation | undefined;
  await persistEvaluationAssociation(
    {
      courseUuid: 'course',
      context: COURSE_EVALUATION_CONTEXT,
      existing: legacy,
      rubricUuid: null,
      primary: true,
    },
    {
      associate: async () => {
        throw new Error('Unexpected creation');
      },
      remove: async () => {
        throw new Error('Must preserve the midterm association');
      },
      update: async input => {
        saved = input.body;
        return { success: true };
      },
    }
  );
  assert.equal(saved?.is_primary_rubric, false);
  assert.equal(saved?.usage_context, 'midterm');
  assert.equal(saved?.rubric_uuid, 'shared-rubric');
});

test('course-specific evaluation defaults take precedence over legacy primary associations', () => {
  const primary = { ...association, is_primary_rubric: true };
  const explicit = {
    ...association,
    rubric_uuid: 'default',
    usage_context: COURSE_EVALUATION_CONTEXT,
  };
  assert.equal(getCourseEvaluationAssociation([primary, explicit])?.rubric_uuid, 'default');
  assert.equal(getCourseEvaluationAssociation([primary]), primary);
});

test('new mappings persist the selected course, assessment and lesson context', async () => {
  let saved: CourseRubricAssociation | undefined;
  const context = lessonEvaluationContext('component', 'lesson');
  await persistEvaluationAssociation(
    { courseUuid: 'course', associatedBy: 'creator', context, rubricUuid: 'rubric' },
    {
      associate: async input => {
        saved = input.body;
        return { success: true };
      },
      update: async () => {
        throw new Error('Unexpected update');
      },
      remove: async () => {
        throw new Error('Unexpected removal');
      },
    }
  );
  assert.deepEqual(saved, {
    course_uuid: 'course',
    rubric_uuid: 'rubric',
    associated_by: 'creator',
    usage_context: context,
    is_primary_rubric: false,
  });
});

test('API envelope errors cannot be treated as successful saves', () => {
  assert.throws(
    () => assertEvaluationResponse({ success: false, message: 'Rejected' }),
    /Rejected/
  );
  assert.throws(() => assertEvaluationResponse({ error: { code: 'DENIED' } }));
  assert.throws(() => assertEvaluationResponse(undefined));
  assert.doesNotThrow(() => assertEvaluationResponse({ success: true }));
});

test('association pagination stops at the final page', () => {
  assert.equal(nextEvaluationPage({ hasNext: true }, 0), 1);
  assert.equal(nextEvaluationPage({ totalPages: 3 }, 1), 2);
  assert.equal(nextEvaluationPage({ totalPages: 3 }, 2), undefined);
  assert.equal(nextEvaluationPage({ hasNext: false, totalPages: 3 }, 1), undefined);
});
