import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classCardFacts } from './class-card-facts';
import { classViewCounts, classViewPage } from './class-views';

const now = new Date('2026-11-05T08:00:00Z');

function card(id: number, open: boolean, online = true) {
  return {
    id,
    facts: classCardFacts(
      {
        registration_period_end_date: new Date(
          open ? '2026-11-06T00:00:00Z' : '2026-10-01T00:00:00Z'
        ),
        location_type: online ? 'ONLINE' : 'IN_PERSON',
        location_name: online ? undefined : 'Training centre',
      },
      [],
      undefined,
      now
    ),
  };
}

test('three open classes on different API pages appear together with a total of three', () => {
  const apiPages = [
    Array.from({ length: 20 }, (_, id) => card(id, id === 8)),
    Array.from({ length: 18 }, (_, index) => card(index + 20, index === 2 || index === 16)),
  ];
  const catalogue = apiPages.flat();
  const result = classViewPage(catalogue, 'open', 0, 20);
  assert.equal(catalogue.length, 38);
  assert.deepEqual(
    result.items.map(item => item.id),
    [8, 22, 36]
  );
  assert.equal(result.total, 3);
  assert.equal(result.totalPages, 1);
  assert.deepEqual(classViewCounts(catalogue), {
    open: 3,
    online: 3,
    in_person: 0,
    soon: 3,
    closed: 35,
  });
});

test('pagination counts and slices matching classes rather than the original API pages', () => {
  const catalogue = Array.from({ length: 60 }, (_, id) => card(id, id % 2 === 0));
  const first = classViewPage(catalogue, 'open', 0, 20);
  const second = classViewPage(catalogue, 'open', 1, 20);
  assert.equal(first.items.length, 20);
  assert.equal(second.items.length, 10);
  assert.equal(second.total, 30);
  assert.equal(second.totalPages, 2);
  assert.deepEqual(
    second.items.map(item => item.id),
    [40, 42, 44, 46, 48, 50, 52, 54, 56, 58]
  );
  assert.equal(classViewCounts(catalogue).open, 30);
});

test('switching from a later page to a small view cannot leave an empty page', () => {
  const catalogue = Array.from({ length: 38 }, (_, id) => card(id, id === 37, false));
  const result = classViewPage(catalogue, 'in_person', 1, 20);
  assert.equal(result.page, 0);
  assert.deepEqual(
    result.items.map(item => item.id),
    [37]
  );
  assert.equal(result.total, 1);
});

test('closed and empty views have consistent totals and at least one UI page', () => {
  const catalogue = [card(1, false), card(2, true, false)];
  const closed = classViewPage(catalogue, 'closed', 0, 20);
  assert.deepEqual(
    closed.items.map(item => item.id),
    [1]
  );
  const online = classViewPage(catalogue, 'online', 0, 20);
  assert.equal(online.total, 0);
  assert.equal(online.totalPages, 1);
  assert.deepEqual(online.items, []);
});
