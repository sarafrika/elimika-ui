import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatPercent, legReason, retainedReasons, type SaleSplit, splitLegs, splitNotes } from './sale-splits';

const SPLIT: SaleSplit = {
  uuid: 'split-1',
  title: 'Introduction to AI',
  currency_code: 'KES',
  line_gross: 50000,
  creator_percentage: 30,
  your_role: 'COURSE_CREATOR',
  your_purse: 'COURSE_CREATOR',
  creator: { role: 'COURSE_CREATOR', name: 'Amina Wanjiru', status: 'PAID', gross: 15000, fee: 1500, net: 13500 },
  delivery: { role: 'ORGANISATION', name: 'Eldoret Institute', status: 'PAID', gross: '35000.00', fee: 3500, net: 31500 },
  platform_fee_total: 5000,
  retained: 5000,
  reconciles: true,
  backfilled: false,
  fee_rule: { description: '10% of each share', recorded: true },
};

test('the creator percentage comes from the server and the delivery share is the rest', () => {
  const [creator, delivery] = splitLegs(SPLIT);
  assert.equal(creator?.heading, 'Course creator share');
  assert.equal(creator?.percentage, 30);
  assert.equal(creator?.mine, true);
  assert.equal(delivery?.heading, 'School share');
  assert.equal(delivery?.percentage, 70);
  assert.equal(delivery?.gross, 35000);
  assert.equal(delivery?.mine, false);
  assert.equal(formatPercent(100 / 3), '33.33%');
  assert.equal(formatPercent(null), null);
});

test('an unpaid share says why Elimika kept it', () => {
  const split = { ...SPLIT, delivery: { role: 'INSTRUCTOR', status: 'NO_EARNER', gross: 35000, fee: 0, net: 0 } };
  const [, delivery] = splitLegs(split);
  assert.equal(delivery?.heading, 'Instructor share');
  assert.match(delivery?.reason ?? '', /nobody was set to receive/);
  assert.deepEqual(retainedReasons(split), ['Instructor share: nobody was set to receive this share, so Elimika kept it.']);
  assert.equal(legReason('PAID'), null);
  assert.match(legReason('NOT_SPLIT') ?? '', /not split/);
});

test('a missing leg reads as not split', () => {
  const [creator] = splitLegs({ ...SPLIT, creator: null, creator_percentage: null });
  assert.equal(creator?.status, 'NOT_SPLIT');
  assert.equal(creator?.percentage, null);
});

test('notes flag a mismatch, a backfilled line and an unrecorded fee rule', () => {
  assert.deepEqual(splitNotes(SPLIT), { mismatch: false, backfilled: false, feeRuleRecorded: true });
  assert.deepEqual(
    splitNotes({ ...SPLIT, reconciles: false, backfilled: true, fee_rule: { recorded: false } }),
    { mismatch: true, backfilled: true, feeRuleRecorded: false }
  );
  assert.equal(splitNotes({ ...SPLIT, reconciles: null }).mismatch, false);
});
