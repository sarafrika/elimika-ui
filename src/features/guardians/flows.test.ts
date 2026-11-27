import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { httpStatusOf } from '@/lib/api-errors';
import { localDate } from '@/lib/date';
import { getErrorMessage } from '@/lib/error-utils';
import { client } from '@/services/client/client.gen';
import {
  acceptByToken,
  addChild,
  getByToken,
  getMyStudents,
  registerAndAccept,
  revokeLink,
  updateStudent,
} from '@/services/client/sdk.gen';
import { requireApiData } from '@/src/features/onboarding/lib/user-onboarding';
import { readAddedChild } from './child-response';
import { assertGuardianInvitationSaved } from './invitation-response';

const originalConfig = client.getConfig();
after(() => client.setConfig(originalConfig));
const link = { uuid: 'guardian-link', student_uuid: 'child-id', status: 'ACTIVE' };

test('invitation registration and existing-account acceptance use token endpoints and date-only DOB', async () => {
  const requests: { url: string; body?: unknown }[] = [];
  client.setConfig({
    baseUrl: 'https://guardian.example.test',
    auth: undefined,
    fetch: async (input, init) => {
      const request = new Request(input, init);
      requests.push({
        url: new URL(request.url).pathname,
        body:
          request.method === 'POST' && request.headers.has('content-type')
            ? await request.json()
            : undefined,
      });
      return Response.json({
        success: true,
        data:
          request.method === 'GET'
            ? { actionable: true, has_account: false, masked_guardian_email: 'm***@example.com' }
            : link,
      });
    },
  });
  const invitation = await getByToken({ path: { token: 'invitation-token' } });
  assert.equal(invitation.error, undefined);
  assert.equal(requireApiData(invitation.data!).actionable, true);
  const registered = await registerAndAccept({
    path: { token: 'invitation-token' },
    body: {
      first_name: 'Mary',
      last_name: 'Doe',
      email: 'mary@example.com',
      dob: localDate('1990-05-12'),
      password: 'chosen-password',
      terms_accepted: true,
    },
  });
  assert.equal(registered.error, undefined);
  assert.equal(requireApiData(registered.data!).student_uuid, 'child-id');
  const accepted = await acceptByToken({ path: { token: 'invitation-token' } });
  assert.equal(accepted.error, undefined);
  assert.equal(requireApiData(accepted.data!).uuid, 'guardian-link');
  assert.deepEqual(
    requests.map(request => request.url),
    [
      '/api/v1/student-guardian-invitations/token/invitation-token',
      '/api/v1/student-guardian-invitations/token/invitation-token/register',
      '/api/v1/student-guardian-invitations/token/invitation-token/accept',
    ]
  );
  assert.deepEqual(requests[1]?.body, {
    first_name: 'Mary',
    last_name: 'Doe',
    email: 'mary@example.com',
    dob: '1990-05-12',
    password: 'chosen-password',
    terms_accepted: true,
  });
});

test('adding a child and listing linked learners use /students with POST and GET', async () => {
  const requests: { method: string; path: string; body?: unknown }[] = [];
  client.setConfig({
    baseUrl: 'https://guardian.example.test',
    auth: undefined,
    fetch: async (input, init) => {
      const request = new Request(input, init);
      requests.push({
        method: request.method,
        path: new URL(request.url).pathname,
        body: request.method === 'POST' ? await request.json() : undefined,
      });
      return Response.json(
        request.method === 'POST'
          ? { success: true, data: link, message: 'Child added to your account' }
          : { success: true, data: [] },
        {
          status: request.method === 'POST' ? 201 : 200,
        }
      );
    },
  });
  const result = await addChild({
    body: {
      first_name: 'John',
      middle_name: 'Kamau',
      last_name: 'Doe',
      dob: localDate('2018-05-12'),
      relationship_type: 'PARENT',
    },
  });
  assert.equal(result.error, undefined);
  assert.deepEqual(readAddedChild(result.data), {
    link: { uuid: 'guardian-link', student_uuid: 'child-id' },
    message: 'Child added to your account',
  });
  await getMyStudents();
  assert.deepEqual(requests, [
    {
      method: 'POST',
      path: '/api/v1/guardians/me/students',
      body: {
        first_name: 'John',
        middle_name: 'Kamau',
        last_name: 'Doe',
        dob: '2018-05-12',
        relationship_type: 'PARENT',
      },
    },
    { method: 'GET', path: '/api/v1/guardians/me/students', body: undefined },
  ]);
});

test('validation, authentication, duplicate and expired-token failures preserve HTTP status and backend detail', async () => {
  for (const [status, message] of [
    [400, 'Email must match the invited address.'],
    [400, 'Password does not meet the password policy.'],
    [400, 'Guardian must be at least 18.'],
    [401, 'Authentication required.'],
    [409, 'This child already exists.'],
    [410, 'This invitation has expired.'],
  ] as const) {
    client.setConfig({
      baseUrl: 'https://guardian.example.test',
      auth: undefined,
      fetch: async () =>
        Response.json({ success: false, errors: { validation: message } }, { status }),
    });
    const result = await getByToken({ path: { token: 'invalid-token' } });
    assert.equal(result.data, undefined);
    assert.equal(httpStatusOf(result.error), status);
    assert.equal(getErrorMessage(result.error, 'fallback'), message);
  }
});

test('student guardian invitations accept bare and wrapped update responses', async () => {
  for (const body of [{ uuid: 'student-id' }, { success: true, data: { uuid: 'student-id' } }]) {
    client.setConfig({
      baseUrl: 'https://guardian.example.test',
      auth: undefined,
      fetch: async (input, init) => {
        const request = new Request(input, init);
        assert.equal(request.method, 'PUT');
        assert.equal(new URL(request.url).pathname, '/api/v1/students/student-id');
        assert.deepEqual(await request.json(), {
          user_uuid: 'student-user-id',
          guardians: [{ name: 'Mary Doe', email: 'mary@example.com', relationship_type: 'PARENT' }],
        });
        return Response.json(body);
      },
    });
    const result = await updateStudent({
      path: { uuid: 'student-id' },
      body: {
        user_uuid: 'student-user-id',
        guardians: [{ name: 'Mary Doe', email: 'mary@example.com', relationship_type: 'PARENT' }],
      },
    });
    assert.equal(result.error, undefined);
    assert.doesNotThrow(() => assertGuardianInvitationSaved(result.data, 'student-id'));
  }
});

test('invitation confirmation rejects failure envelopes and unrelated or missing student records', () => {
  assert.throws(
    () =>
      assertGuardianInvitationSaved(
        { success: false, message: 'Guardian limit reached.', data: { uuid: 'student-id' } },
        'student-id'
      ),
    /Guardian limit reached/
  );
  assert.throws(
    () =>
      assertGuardianInvitationSaved({ error: { email: 'Invalid guardian email.' } }, 'student-id'),
    /Invalid guardian email/
  );
  assert.throws(
    () =>
      assertGuardianInvitationSaved(
        { success: true, data: { uuid: 'another-student' } },
        'student-id'
      ),
    /not confirmed/
  );
  assert.throws(() => assertGuardianInvitationSaved(undefined, 'student-id'), /not confirmed/);
});

test('add-child confirmation accepts wrapped and bare links and preserves the backend success message', () => {
  const child = {
    uuid: '4aa556f8-9d21-4cbd-8c01-2fbfcfb28d8d',
    student_uuid: '0d2f9d6a-65d6-4c19-803b-b1a4a86f12dd',
    status: 'ACTIVE',
  };
  for (const response of [
    child,
    { success: true, data: child, message: 'Child added to your account' },
  ]) {
    const added = readAddedChild(response);
    assert.equal(added.link.student_uuid, child.student_uuid);
    assert.equal(added.message, 'Child added to your account');
  }
  assert.equal(
    readAddedChild({ success: true, data: child, message: 'Your learner is ready.' }).message,
    'Your learner is ready.'
  );
  assert.throws(
    () => readAddedChild({ success: false, data: child, message: 'This child already exists.' }),
    /This child already exists/
  );
  assert.throws(() => readAddedChild({ success: true, data: {} }), /not confirmed/);
});

test('revoking guardian access deletes the link UUID and preserves permission errors', async () => {
  let requests = 0;
  client.setConfig({
    baseUrl: 'https://guardian.example.test',
    auth: () => 'guardian-token',
    fetch: async (input, init) => {
      const request = new Request(input, init);
      assert.equal(request.method, 'DELETE');
      assert.equal(new URL(request.url).pathname, '/api/v1/guardians/links/guardian-link-id');
      assert.equal(request.headers.get('authorization'), 'Bearer guardian-token');
      requests++;
      return requests === 1
        ? Response.json({ success: true, message: 'Guardian access revoked' })
        : Response.json(
            { success: false, message: 'You may only revoke your own guardian access.' },
            { status: 403 }
          );
    },
  });
  const success = await revokeLink({ path: { linkUuid: 'guardian-link-id' } });
  assert.equal(success.error, undefined);
  assert.equal(success.data?.success, true);
  const denied = await revokeLink({ path: { linkUuid: 'guardian-link-id' } });
  assert.equal(denied.data, undefined);
  assert.equal(httpStatusOf(denied.error), 403);
  assert.equal(
    getErrorMessage(denied.error, 'fallback'),
    'You may only revoke your own guardian access.'
  );
});
