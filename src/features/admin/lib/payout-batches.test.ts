import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adminRoutes } from './admin-routes';
import {
  approveBlockReason,
  BATCH_GROUP_STATUSES,
  BATCH_GROUPS,
  batchGroupOf,
  batchProgress,
  canConfirmApproval,
  floatState,
  isBatchLive,
  sumAmounts,
} from './payout-batches';

test('every batch status sits in exactly one list tab', () => {
  const all = BATCH_GROUPS.flatMap(group => BATCH_GROUP_STATUSES[group]);
  assert.equal(new Set(all).size, all.length);
  assert.equal(all.length, 7);
  assert.equal(batchGroupOf('DRAFT'), 'drafts');
  assert.equal(batchGroupOf('AWAITING_APPROVAL'), 'awaiting');
  assert.equal(batchGroupOf('RELEASED'), 'progress');
  assert.equal(batchGroupOf('PARTLY_FAILED'), 'done');
  assert.equal(batchGroupOf('COMPLETED'), 'done');
  assert.equal(batchGroupOf('CANCELLED'), 'closed');
  assert.equal(batchGroupOf('NONSENSE'), undefined);
  assert.equal(batchGroupOf(undefined), undefined);
});

test('selection totals add up in cents', () => {
  assert.equal(sumAmounts([0.1, 0.2]), 0.3);
  assert.equal(sumAmounts(['1500', 2500.5, null, undefined, 'x']), 4000.5);
  assert.equal(sumAmounts([]), 0);
});

test('the float covers, falls short of, or cannot be judged against a batch', () => {
  assert.deepEqual(floatState(10_000, { utility_funds: 12_500 }), {
    kind: 'enough',
    float: 12_500,
    spare: 2_500,
  });
  assert.deepEqual(floatState('10000', { utility_funds: '10000' }), {
    kind: 'enough',
    float: 10_000,
    spare: 0,
  });
  assert.deepEqual(floatState(10_000, { utility_funds: 9_999.5 }), {
    kind: 'short',
    float: 9_999.5,
    shortBy: 0.5,
  });
  assert.deepEqual(floatState(10_000, { utility_funds: null, working_funds: 50_000 }), {
    kind: 'unknown',
  });
  assert.deepEqual(floatState(10_000, null), { kind: 'unknown' });
});

test('progress counts what is still waiting to be sent', () => {
  assert.deepEqual(
    batchProgress({ row_count: 10, paid_count: 4, failed_count: 1, in_flight_count: 3 }),
    {
      total: 10,
      paid: 4,
      failed: 1,
      inFlight: 3,
      waiting: 2,
    }
  );
  assert.equal(batchProgress({}).waiting, 0);
});

test('a released batch or one with rows in flight keeps polling', () => {
  assert.equal(isBatchLive({ status: 'RELEASED', in_flight_count: 0 }), true);
  assert.equal(isBatchLive({ status: 'PARTLY_FAILED', in_flight_count: 2 }), true);
  assert.equal(isBatchLive({ status: 'COMPLETED', in_flight_count: 0 }), false);
  assert.equal(isBatchLive(undefined), false);
});

test('approval is explained when it is off', () => {
  const enough = floatState(100, { utility_funds: 500 });
  const waiting = {
    status: 'AWAITING_APPROVAL' as const,
    created_by: 'maker',
    submitted_by: 'maker',
  };
  assert.equal(approveBlockReason({ ...waiting, can_approve: true }, enough, 'checker'), null);
  assert.match(
    approveBlockReason({ ...waiting, can_approve: false }, enough, 'maker') ?? '',
    /You made this batch/
  );
  assert.match(
    approveBlockReason({ ...waiting, can_approve: false }, enough, 'other') ?? '',
    /another admin must/
  );
  assert.match(
    approveBlockReason(
      { ...waiting, can_approve: true },
      floatState(900, { utility_funds: 500 })
    ) ?? '',
    /too low/
  );
  assert.equal(approveBlockReason({ ...waiting, can_approve: true }, { kind: 'unknown' }), null);
  assert.match(
    approveBlockReason({ ...waiting, status: 'DRAFT', can_approve: true }, enough) ?? '',
    /awaiting approval/
  );
});

test('an unknown float needs the explicit override to confirm', () => {
  assert.equal(canConfirmApproval({ kind: 'unknown' }, false), false);
  assert.equal(canConfirmApproval({ kind: 'unknown' }, true), true);
  assert.equal(canConfirmApproval({ kind: 'short', float: 1, shortBy: 1 }, true), false);
  assert.equal(canConfirmApproval({ kind: 'enough', float: 1, spare: 0 }, false), true);
});

test('batch links carry their id and tab', () => {
  assert.equal(adminRoutes.payoutBatch('b-1'), '/dashboard/admin/payouts/batches/b-1');
  assert.equal(
    adminRoutes.payouts('batches', { group: 'awaiting' }),
    '/dashboard/admin/payouts?tab=batches&group=awaiting'
  );
});
