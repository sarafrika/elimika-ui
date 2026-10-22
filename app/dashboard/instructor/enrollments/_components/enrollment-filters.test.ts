import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Enrollment } from '@/services/client/types.gen';
import { filterRosterClasses, isActiveClass } from './enrollment-filters';

const now = Date.parse('2026-10-21T12:00:00Z');
type RosterClass = Parameters<typeof filterRosterClasses>[0][number];

function enrollment(student_uuid: string, status: Enrollment['status'] = 'ENROLLED'): Enrollment {
  return { student_uuid, status, scheduled_instance_uuid: 'next-session' };
}

function runningClass(overrides: Partial<RosterClass> = {}): RosterClass {
  return {
    is_active: true,
    class_progress_percentage: 50,
    schedule: [
      {
        uuid: 'previous-session',
        start_time: new Date('2026-10-20T09:00:00Z'),
        end_time: new Date('2026-10-20T10:00:00Z'),
        status: 'COMPLETED',
      },
      {
        uuid: 'next-session',
        start_time: new Date('2026-10-22T09:00:00Z'),
        end_time: new Date('2026-10-22T10:00:00Z'),
        status: 'SCHEDULED',
      },
    ],
    enrollment: [enrollment('student-1')],
    ...overrides,
  };
}

test('all students includes historical, current, future, and unscheduled classes', () => {
  const classes = [
    runningClass({ is_active: false, class_progress_percentage: 100 }),
    runningClass(),
    runningClass({ schedule: runningClass().schedule?.slice(1) ?? [] }),
    runningClass({ schedule: [] }),
  ];
  const filtered = filterRosterClasses(classes, 'all', now);
  assert.equal(filtered.length, 4);
  assert.ok(filtered.every(classItem => classItem.enrollment?.length === 1));
});

test('waitlisted and cancelled students do not appear as enrolled students', () => {
  const classItem = runningClass({
    enrollment: [
      enrollment('enrolled'),
      enrollment('attended', 'ATTENDED'),
      enrollment('absent', 'ABSENT'),
      enrollment('waiting', 'WAITLISTED'),
      enrollment('cancelled', 'CANCELLED'),
    ],
  });
  assert.deepEqual(
    filterRosterClasses([classItem], 'all', now)[0]?.enrollment?.map(item => item.student_uuid),
    ['enrolled', 'attended', 'absent']
  );
  assert.equal(classItem.enrollment?.length, 5);
});

test('active classes remain active between sessions but exclude future and finished classes', () => {
  assert.equal(isActiveClass(runningClass(), now), true);
  assert.equal(isActiveClass(runningClass({ is_active: false }), now), false);
  assert.equal(isActiveClass(runningClass({ class_progress_percentage: 100 }), now), false);
  assert.equal(isActiveClass(runningClass({ schedule: [] }), now), false);
  assert.equal(
    isActiveClass(runningClass({ schedule: runningClass().schedule?.slice(1) ?? [] }), now),
    false
  );
  assert.equal(
    isActiveClass(runningClass({ schedule: runningClass().schedule?.slice(0, 1) ?? [] }), now),
    false
  );
});

test('cancelled, blocked, and concluded sessions cannot keep a class active', () => {
  const sessions = runningClass().schedule ?? [];
  for (const status of ['CANCELLED', 'BLOCKED', 'COMPLETED'] as const) {
    const classItem = runningClass({
      schedule: sessions.map(session => ({ ...session, status })),
    });
    assert.equal(isActiveClass(classItem, now), false);
  }
  assert.equal(
    isActiveClass(
      runningClass({
        schedule: sessions.map(session => ({ ...session, concluded_at: new Date(now) })),
      }),
      now
    ),
    false
  );
});

test('active students must hold a current enrollment in an unfinished session of the class', () => {
  const classItem = runningClass({
    enrollment: [
      enrollment('current'),
      { ...enrollment('inactive'), is_active: false },
      { ...enrollment('past-only', 'ATTENDED'), scheduled_instance_uuid: 'previous-session' },
      { ...enrollment('other-class'), scheduled_instance_uuid: 'unrelated-session' },
      enrollment('waiting', 'WAITLISTED'),
      enrollment('cancelled', 'CANCELLED'),
    ],
  });
  assert.deepEqual(
    filterRosterClasses([classItem], 'active', now)[0]?.enrollment?.map(item => item.student_uuid),
    ['current']
  );
});
