import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRegistrationRequest,
  emptyOnboardingDraft,
  personalDetailsSchema,
  readOnboardingDraft,
  requireApiData,
  requireApiSuccess,
} from './user-onboarding';

const personal = {
  first_name: ' Amina ',
  last_name: ' Otieno ',
  email: 'amina@example.com',
  phone_number: '+254712345678',
  dob: '1995-02-20',
  gender: 'FEMALE' as const,
  terms_accepted: true,
};

test('registration sends the selected domain, accepted terms and a date-only DOB', () => {
  const body = JSON.parse(JSON.stringify(buildRegistrationRequest(personal, '')));
  assert.deepEqual(body, {
    ...personal,
    first_name: 'Amina',
    last_name: 'Otieno',
    domain: 'course_creator',
  });
  assert.equal('captcha_token' in body, false);
  assert.equal(buildRegistrationRequest(personal, ' token ').captcha_token, 'token');
});

test('registration rejects unaccepted terms, invalid dates and incomplete personal details', () => {
  for (const changes of [
    { terms_accepted: false },
    { dob: '2025-02-30' },
    { dob: '2999-01-01' },
    { first_name: ' ' },
    { email: 'invalid' },
    { phone_number: '0712345678' },
    { gender: '' },
  ])
    assert.equal(personalDetailsSchema.safeParse({ ...personal, ...changes }).success, false);
});

test('draft recovery preserves the post-registration handoff and discards corrupt or obsolete drafts', () => {
  const draft = { ...emptyOnboardingDraft(), step: 3, registeredEmail: personal.email };
  assert.deepEqual(readOnboardingDraft(JSON.stringify(draft)), draft);
  for (const corrupt of [null, '{', '{}', JSON.stringify({ ...draft, step: 50 })]) {
    assert.deepEqual(readOnboardingDraft(corrupt), emptyOnboardingDraft());
  }
});

test('failure envelopes cannot advance the flow even if the HTTP request succeeded', () => {
  assert.throws(
    () => requireApiData({ success: false, message: 'Select a category', data: {} }),
    /Select a category/
  );
  assert.throws(() => requireApiSuccess({ error: { reason: 'invalid' }, data: {} }));
  assert.throws(() => requireApiData({ success: true }));
  assert.deepEqual(requireApiData({ success: true, data: { verification_status: 'SUBMITTED' } }), {
    verification_status: 'SUBMITTED',
  });
});
