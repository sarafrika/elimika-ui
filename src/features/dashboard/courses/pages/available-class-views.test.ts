import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  AVAILABLE_CLASS_VIEWS,
  availableClassCounts,
  availableClassPage,
  availableClassStatus,
} from './available-class-views';

const now = new Date('2026-11-05T08:00:00Z');

function card(id: number, open: boolean, enrolled = false, online = true) {
  return {
    id,
    ...availableClassStatus(
      {
        schedule: [],
        scheduleLoaded: true,
        location_type: online ? 'ONLINE' : 'IN_PERSON',
        location_name: online ? undefined : 'Training centre',
        registration_period_end_date: new Date(
          open ? '2026-11-06T00:00:00Z' : '2026-10-01T00:00:00Z'
        ),
        isStudentEnrolled: enrolled,
      },
      now
    ),
  };
}

test('available-class tabs include enrolled and default to all open', () => {
  assert.deepEqual(
    AVAILABLE_CLASS_VIEWS.map(view => view.id),
    ['open', 'online', 'in_person', 'soon', 'enrolled', 'closed']
  );
});

test('counts and filters cover all 38 classes before pagination', () => {
  const catalogue = Array.from({ length: 38 }, (_, id) =>
    card(id, [8, 22, 36].includes(id), [22, 35].includes(id), id !== 22)
  );
  assert.deepEqual(availableClassCounts(catalogue), {
    open: 3,
    online: 2,
    in_person: 1,
    soon: 3,
    enrolled: 2,
    closed: 35,
  });
  const open = availableClassPage(catalogue, 'open', 0, 20);
  assert.deepEqual(
    open.items.map(item => item.id),
    [8, 22, 36]
  );
  assert.equal(open.total, 3);
  assert.equal(open.totalPages, 1);
  const enrolled = availableClassPage(catalogue, 'enrolled', 0, 20);
  assert.deepEqual(
    enrolled.items.map(item => item.id),
    [22, 35]
  );
  assert.equal(enrolled.total, 2);
});

test('every view paginates matches into at most twenty cards', () => {
  const catalogue = Array.from({ length: 45 }, (_, id) => card(id, true, true));
  for (const view of ['open', 'online', 'soon', 'enrolled'] as const) {
    assert.equal(availableClassPage(catalogue, view, 0, 20).items.length, 20);
    assert.equal(availableClassPage(catalogue, view, 1, 20).items.length, 20);
    const last = availableClassPage(catalogue, view, 2, 20);
    assert.equal(last.items.length, 5);
    assert.equal(last.totalPages, 3);
    assert.equal(last.total, 45);
  }
});

test('a smaller or empty tab clamps a previously selected page', () => {
  const catalogue = Array.from({ length: 45 }, (_, id) => card(id, true, id === 44));
  const enrolled = availableClassPage(catalogue, 'enrolled', 2, 20);
  assert.equal(enrolled.page, 0);
  assert.deepEqual(
    enrolled.items.map(item => item.id),
    [44]
  );
  const closed = availableClassPage(catalogue, 'closed', 2, 20);
  assert.equal(closed.total, 0);
  assert.equal(closed.page, 0);
  assert.equal(closed.totalPages, 1);
});

test('dated classes without loaded schedules are closed after their academic end', () => {
  const status = availableClassStatus(
    {
      schedule: [],
      scheduleLoaded: false,
      academic_period_end_date: new Date('2026-11-01T00:00:00Z'),
      registration_period_end_date: new Date('2026-11-06T00:00:00Z'),
    },
    now
  );
  assert.equal(status.facts.closed, true);
  assert.equal(status.facts.closedReason, 'ended');
  assert.equal(status.facts.closingSoon, false);
});
