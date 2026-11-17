import assert from 'node:assert/strict';
import test from 'node:test';
import { GROUP_ROSTER_CONCURRENCY, loadInviteGroupStudents } from './load-invite-group-students';

test('loads every selected group and page while bounding concurrent requests', async () => {
  const groups = Array.from({ length: 8 }, (_, index) => `group-${index}`);
  let active = 0;
  let peak = 0;
  const calls: string[] = [];
  const rows = await loadInviteGroupStudents(
    groups,
    async (groupUuid, page) => {
      active += 1;
      peak = Math.max(peak, active);
      calls.push(`${groupUuid}:${page}`);
      await Promise.resolve();
      active -= 1;
      return {
        success: true,
        data: {
          content: [{ group_uuid: groupUuid, student_uuid: `${groupUuid}-${page}` }],
          metadata: { totalPages: 3 },
        },
      };
    },
    () => false
  );
  assert.equal(peak, GROUP_ROSTER_CONCURRENCY);
  assert.equal(rows.length, 24);
  assert.equal(new Set(calls).size, 24);
  for (const group of groups) {
    assert.deepEqual(
      calls.filter(call => call.startsWith(`${group}:`)),
      [0, 1, 2].map(page => `${group}:${page}`)
    );
  }
});

test('an unsuccessful page rejects the audience instead of returning a partial send list', async () => {
  await assert.rejects(
    loadInviteGroupStudents(
      ['group'],
      async () => ({ success: false, message: 'Access denied' }),
      () => false
    ),
    /Access denied/
  );
});

test('stops loading pages when the selected groups change', async () => {
  let cancelled = false;
  let calls = 0;
  const rows = await loadInviteGroupStudents(
    ['old-group'],
    async () => {
      calls += 1;
      cancelled = true;
      return { data: { content: [{ group_uuid: 'old-group' }], metadata: { totalPages: 10 } } };
    },
    () => cancelled
  );
  assert.equal(calls, 1);
  assert.deepEqual(rows, []);
});
