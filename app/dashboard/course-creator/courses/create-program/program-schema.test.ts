import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assertProgramResponse,
  defaultProgramValues,
  programBody,
  programFormSchema,
  type ProgramFormValues,
} from './program-schema';

function validValues(): ProgramFormValues {
  return {
    ...defaultProgramValues(),
    title: ' Music pathway ',
    categoryUuids: ['category-id'],
    description: 'A complete pathway for music students.',
    classLimit: '20',
  };
}

const course = (courseUuid: string, prerequisiteCourseUuid = '') => ({
  courseUuid,
  prerequisiteCourseUuid,
  isRequired: true,
});

test('drafts accept no courses and an unset price', () => {
  const result = programFormSchema.parse(validValues());
  assert.equal(result.title, 'Music pathway');
  assert.equal(result.price, '');
  assert.deepEqual(result.courses, []);
});

test('requires a meaningful title, description, category and positive whole class limit', () => {
  for (const patch of [
    { title: '   ' },
    { description: '  ' },
    { categoryUuids: [] },
    { classLimit: '' },
    { classLimit: '0' },
    { classLimit: '2.5' },
    { classLimit: '-1' },
  ]) {
    assert.equal(programFormSchema.safeParse({ ...validValues(), ...patch }).success, false);
  }
});

test('rejects invalid prices and durations instead of silently clamping them', () => {
  for (const patch of [
    { price: '-1' },
    { price: 'invalid' },
    { price: 'Infinity' },
    { totalDurationHours: -1 },
    { totalDurationHours: 1.5 },
    { totalDurationMinutes: 60 },
  ]) {
    assert.equal(programFormSchema.safeParse({ ...validValues(), ...patch }).success, false);
  }
});

test('publishing needs at least two courses and an explicit price; free programs can publish', () => {
  const values = {
    ...validValues(),
    status: 'published',
    courses: [course('one'), course('two', 'one')],
  };
  assert.equal(programFormSchema.safeParse(values).success, false);
  assert.equal(programFormSchema.safeParse({ ...values, price: '0' }).success, true);
  assert.equal(
    programFormSchema.safeParse({ ...values, price: '0', courses: [course('one')] }).success,
    false
  );
});

test('rejects duplicate courses and missing, self or later prerequisites', () => {
  for (const courses of [
    [course('one'), course('one')],
    [course('one', 'missing')],
    [course('one', 'one')],
    [course('one', 'two'), course('two')],
  ]) {
    assert.equal(programFormSchema.safeParse({ ...validValues(), courses }).success, false);
  }
  assert.equal(
    programFormSchema.safeParse({
      ...validValues(),
      courses: [course('one'), course('two', 'one')],
    }).success,
    true
  );
});

test('requires requirement text and a supported requirement type', () => {
  const requirement = { requirementText: ' ', requirementType: 'STUDENT', isMandatory: true };
  assert.equal(
    programFormSchema.safeParse({ ...validValues(), requirements: [requirement] }).success,
    false
  );
  assert.equal(
    programFormSchema.safeParse({
      ...validValues(),
      requirements: [{ ...requirement, requirementText: 'Bring an instrument' }],
    }).success,
    true
  );
});

test('new program payload stays a draft until the dedicated publish operation', () => {
  const values = { ...validValues(), status: 'published' as const, price: '0' };
  const body = programBody(values, 'creator-id');
  assert.equal(body.status, 'draft');
  assert.equal(body.published, false);
  assert.equal(body.active, false);
  assert.equal(body.price, 0);
  assert.equal(body.class_limit, 20);
  assert.equal(body.title, 'Music pathway');
  assert.equal(programBody(validValues(), 'creator-id').price, null);
});

test('editing preserves the saved lifecycle and owner', () => {
  const existing = {
    ...programBody(validValues(), 'owner'),
    uuid: 'program-id',
    status: 'published' as const,
    active: true,
    published: true,
  };
  const body = programBody(validValues(), 'different-profile', existing);
  assert.equal(body.status, 'published');
  assert.equal(body.published, true);
  assert.equal(body.course_creator_uuid, 'owner');
});

test('API envelopes with errors never count as saved', () => {
  assert.throws(
    () => assertProgramResponse({ success: false, message: 'Cannot publish' }, 'Failed'),
    /Cannot publish/
  );
  assert.throws(
    () => assertProgramResponse({ error: { title: 'Invalid' }, data: { uuid: 'id' } }, 'Failed'),
    /Failed/
  );
  assert.doesNotThrow(() =>
    assertProgramResponse({ success: true, data: { uuid: 'id' } }, 'Failed')
  );
  assert.doesNotThrow(() => assertProgramResponse(undefined, 'Failed'));
});
