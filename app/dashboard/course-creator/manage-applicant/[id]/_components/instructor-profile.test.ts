import assert from 'node:assert/strict';
import test from 'node:test';
import { instructorDisplayName, resolveInstructorProfile } from './instructor-profile';

const instructor = {
  uuid: 'instructor-id',
  user_uuid: 'user-id',
  full_name: 'Ada Okafor',
  professional_headline: 'Mathematics instructor',
  bio: 'Experienced educator',
};

test('reads identity and professional details from bare and wrapped instructor responses', () => {
  assert.deepEqual(resolveInstructorProfile(instructor), instructor);
  assert.deepEqual(resolveInstructorProfile({ success: true, data: instructor }), instructor);
  assert.deepEqual(resolveInstructorProfile({ data: instructor }), instructor);
});

test('does not treat unsuccessful responses as instructor profiles', () => {
  for (const response of [
    undefined,
    null,
    {},
    { success: true, data: null },
    { success: false, data: instructor },
    { error: { message: 'Access denied' }, data: instructor },
    { uuid: 'instructor-id', user_uuid: '' },
  ]) {
    assert.equal(resolveInstructorProfile(response), undefined);
  }
});

test('uses user identity when the instructor profile has no full name', () => {
  assert.equal(instructorDisplayName(instructor, { full_name: 'Other name' }), 'Ada Okafor');
  assert.equal(
    instructorDisplayName({ user_uuid: 'user-id' }, { full_name: 'Ada Okafor' }),
    'Ada Okafor'
  );
  assert.equal(instructorDisplayName(undefined, { display_name: 'Ada Okafor' }), 'Ada Okafor');
  assert.equal(
    instructorDisplayName(undefined, { first_name: 'Ada', last_name: 'Okafor' }),
    'Ada Okafor'
  );
  assert.equal(instructorDisplayName(), '');
});
