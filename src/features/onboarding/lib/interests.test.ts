import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { QueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/error-utils';
import { httpStatusOf } from '@/lib/api-errors';
import { getMyInterestsOptions } from '@/services/client/@tanstack/react-query.gen';
import { client } from '@/services/client/client.gen';
import { updateMyInterests } from '@/services/client/sdk.gen';
import { interestDomain, readInterests, toggleInterest } from './interests';

const technology = { category_uuid: 'uuid-tech', name: 'Technology' };
const business = { category_uuid: 'uuid-business', name: 'Business' };
const originalConfig = client.getConfig();
after(() => client.setConfig(originalConfig));

test('interests are limited to the four supported domains and route aliases map to API domains', () => {
  for (const [role, expected] of [
    ['student', 'student'],
    ['INSTRUCTOR', 'instructor'],
    ['course-creator', 'course_creator'],
    ['course_creator', 'course_creator'],
    ['organisation', 'organisation_user'],
    ['organisation_user', 'organisation_user'],
  ])
    assert.equal(interestDomain(role!), expected);
  for (const domain of ['parent', 'admin', 'super_admin', ''])
    assert.equal(interestDomain(domain), null);
});

test('saved selections read both response formats and retain server order', () => {
  const data = { domain: 'student', categories: [business, technology] };
  assert.deepEqual(readInterests(data), [business, technology]);
  assert.deepEqual(readInterests({ success: true, data }), [business, technology]);
  assert.deepEqual(readInterests({ domain: 'student', categories: [] }), []);
  assert.deepEqual(readInterests({ categories: [business, technology, business] }), [
    business,
    technology,
  ]);
  assert.throws(
    () => readInterests({ success: false, message: 'Unsupported domain.' }),
    /Unsupported domain/
  );
  assert.throws(() => readInterests({ categories: [{ name: 'Missing UUID' }] }), /Unable to read/);
});

test('selection changes preserve click order and remove by UUID without mutating saved selections', () => {
  const saved = [business, technology];
  const removed = toggleInterest(saved, { ...business, name: 'Renamed category' });
  assert.deepEqual(removed, [technology]);
  assert.deepEqual(toggleInterest(removed, business), [technology, business]);
  assert.deepEqual(toggleInterest([business], business), []);
  assert.deepEqual(saved, [business, technology]);
});

test('authenticated interest API loads selections and submits ordered UUID replacements including an empty list', async () => {
  const requests: { method: string; path: string; body?: unknown }[] = [];
  client.setConfig({
    baseUrl: 'https://interests.example.test',
    auth: () => 'signed-in-user',
    fetch: async (input, init) => {
      const request = new Request(input, init);
      assert.equal(request.headers.get('authorization'), 'Bearer signed-in-user');
      const body = request.method === 'PUT' ? await request.json() : undefined;
      requests.push({ method: request.method, path: new URL(request.url).pathname, body });
      const categories =
        request.method === 'GET'
          ? [business, technology]
          : body.category_uuids.length
            ? [technology, business]
            : [];
      return Response.json({ success: true, data: { domain: 'course_creator', categories } });
    },
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const response = await queryClient.fetchQuery(
    getMyInterestsOptions({ path: { domain: 'course_creator' } })
  );
  assert.deepEqual(readInterests(response), [business, technology]);
  for (const ids of [['uuid-tech', 'uuid-business'], []]) {
    const result = await updateMyInterests({
      path: { domain: 'course_creator' },
      body: { category_uuids: ids },
    });
    assert.equal(result.error, undefined);
    assert.deepEqual(
      readInterests(result.data).map(item => item.category_uuid),
      ids
    );
  }
  assert.deepEqual(requests, [
    { method: 'GET', path: '/api/v1/users/me/interests/course_creator', body: undefined },
    {
      method: 'PUT',
      path: '/api/v1/users/me/interests/course_creator',
      body: { category_uuids: ['uuid-tech', 'uuid-business'] },
    },
    {
      method: 'PUT',
      path: '/api/v1/users/me/interests/course_creator',
      body: { category_uuids: [] },
    },
  ]);
  queryClient.clear();
});

test('invalid and unauthenticated saves expose useful backend errors', async () => {
  for (const [status, message] of [
    [400, 'An interest category is inactive.'],
    [401, 'Authentication required.'],
  ] as const) {
    client.setConfig({
      baseUrl: 'https://interests.example.test',
      auth: undefined,
      fetch: async () =>
        Response.json({ success: false, errors: { category_uuids: message } }, { status }),
    });
    const selection = [technology, business];
    const result = await updateMyInterests({
      path: { domain: 'student' },
      body: { category_uuids: selection.map(item => item.category_uuid) },
    });
    assert.equal(result.data, undefined);
    assert.equal(httpStatusOf(result.error), status);
    assert.equal(getErrorMessage(result.error, 'fallback'), message);
    assert.deepEqual(selection, [technology, business]);
  }
});
