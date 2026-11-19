import assert from 'node:assert/strict';
import test from 'node:test';
import type { CourseTrainingRequirement, ProgramRequirement } from '@/services/client';
import {
  applyReducer,
  buildApplicationPayload,
  initialApplyState,
  isApplicantTrainingRequirement,
  programRequirementPrompt,
  validateAnswers,
  validatePricing,
} from './apply-model';

const requirement = (
  uuid: string,
  provided_by?: CourseTrainingRequirement['provided_by']
): CourseTrainingRequirement => ({
  uuid,
  course_uuid: 'course',
  name: uuid,
  requirement_type: 'equipment',
  provided_by,
});

const requirements = [
  requirement('organisation-equipment', 'organisation'),
  requirement('instructor-equipment', 'instructor'),
  requirement('student-equipment', 'student'),
  requirement('creator-equipment', 'course_creator'),
  requirement('unassigned-equipment'),
];

for (const applicantType of ['organisation', 'instructor'] as const) {
  test(`${applicantType} applicants only answer their own requirements`, () => {
    const visible = requirements.filter(row => isApplicantTrainingRequirement(row, applicantType));
    assert.deepEqual(
      visible.map(row => row.uuid),
      [`${applicantType}-equipment`]
    );

    // Editing a previous application must drop answers now owned by another provider.
    const previous = {
      ...initialApplyState(applicantType),
      answers: requirements.map(row => ({
        requirementUuid: row.uuid!,
        requirementName: row.name,
        has: 'yes' as const,
      })),
    };
    const state = applyReducer(previous, {
      type: 'initAnswers',
      requirements: visible.map(row => ({ uuid: row.uuid!, name: row.name })),
    });
    assert.deepEqual(validateAnswers(state.answers), []);
    assert.deepEqual(
      buildApplicationPayload(state, { applicantType, isProgram: false }).requirement_answers,
      [{ requirement_uuid: `${applicantType}-equipment`, has_it: true }]
    );
  });
}

test('provider aliases and case are normalised before matching', () => {
  for (const provider of [
    'organisation',
    'organization',
    'organisation_user',
    'organization_user',
    'training_center',
    ' ORGANISATION ',
  ]) {
    assert.equal(isApplicantTrainingRequirement({ provided_by: provider }, 'organisation'), true);
    assert.equal(isApplicantTrainingRequirement({ provided_by: provider }, 'instructor'), false);
  }
  assert.equal(isApplicantTrainingRequirement({ provided_by: ' INSTRUCTOR ' }, 'instructor'), true);
});

test('missing and unknown providers are not assigned to either applicant', () => {
  for (const provided_by of [undefined, null, '', 'unknown', 'student', 'course_creator']) {
    for (const applicantType of ['organisation', 'instructor'] as const) {
      assert.equal(isApplicantTrainingRequirement({ provided_by }, applicantType), false);
    }
  }
});

test('applicants without matching requirements can continue without answers', () => {
  const state = applyReducer(initialApplyState('organisation'), {
    type: 'initAnswers',
    requirements: [],
  });
  assert.deepEqual(validateAnswers(state.answers), []);
  assert.deepEqual(
    buildApplicationPayload(state, { applicantType: 'organisation', isProgram: false })
      .requirement_answers,
    []
  );
});

test('pricing blocks progression when either supplied rate is below the minimum', () => {
  const minimumFee = 100;
  for (const rate of [0, 50, 99.99]) {
    for (const key of ['private_online_hourly_rate', 'private_online_daily_rate'] as const) {
      const card = { private_online_hourly_rate: 200, private_online_daily_rate: 200, [key]: rate };
      assert.ok(validatePricing(card, minimumFee).length > 0);
    }
  }
  assert.deepEqual(validatePricing({ private_online_hourly_rate: 100 }, minimumFee), []);
  assert.deepEqual(validatePricing({ private_online_daily_rate: 101 }, minimumFee), []);
});

test('programme requirements are filtered by their applicant classification', () => {
  const rows: ProgramRequirement[] = [
    {
      uuid: 'venue',
      program_uuid: 'program',
      requirement_type: 'TRAINING_CENTER',
      requirement_text: 'Provide a training venue',
    },
    {
      uuid: 'teaching',
      program_uuid: 'program',
      requirement_type: 'INSTRUCTOR',
      requirement_text: 'Have teaching experience',
    },
    {
      uuid: 'learner',
      program_uuid: 'program',
      requirement_type: 'STUDENT',
      requirement_text: 'Meet the entry requirements',
    },
  ];
  assert.deepEqual(
    rows.filter(row => isApplicantTrainingRequirement(row, 'organisation')).map(row => row.uuid),
    ['venue']
  );
  assert.deepEqual(
    rows.filter(row => isApplicantTrainingRequirement(row, 'instructor')).map(row => row.uuid),
    ['teaching']
  );
});

test('an explicit provider takes precedence over the requirement classification', () => {
  const row = { provided_by: 'student', requirement_type: 'INSTRUCTOR' };
  assert.equal(isApplicantTrainingRequirement(row, 'instructor'), false);
  assert.equal(isApplicantTrainingRequirement(row, 'organisation'), false);
});

test('programme applicants must answer Yes or No and choose acquisition when answering No', () => {
  const prompt = programRequirementPrompt({
    uuid: 'venue',
    program_uuid: 'program',
    requirement_type: 'TRAINING_CENTER',
    requirement_text: 'Provide a training venue',
  });
  let state = applyReducer(initialApplyState('organisation'), {
    type: 'initAnswers',
    requirements: [prompt],
  });
  assert.equal(validateAnswers(state.answers).length, 1);
  state = applyReducer(state, { type: 'answerHas', uuid: 'venue', has: 'no' });
  assert.match(validateAnswers(state.answers)[0]!, /lease or hire/);
  state = applyReducer(state, { type: 'answerAcquisition', uuid: 'venue', acquisition: 'lease' });
  assert.deepEqual(validateAnswers(state.answers), []);
  state = applyReducer(state, { type: 'answerHas', uuid: 'venue', has: 'yes' });
  assert.deepEqual(validateAnswers(state.answers), []);
  assert.equal(state.answers[0]?.acquisition, undefined);
});
