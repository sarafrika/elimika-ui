import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filterEntries, obligationEntries, orderEntries, statementEntries } from './ledger';

const sale = {
  uuid: 't1',
  transaction_type: 'SALE',
  amount: 35000,
  currency_code: 'KES',
  balance_after: 35000,
  reference: 'order-1:line-1:delivery',
  description: 'Class sale share - Flower Gardening',
  created_date: '2026-10-20T11:05:00Z',
};
const fee = {
  uuid: 't2',
  transaction_type: 'PLATFORM_FEE',
  amount: 3500,
  currency_code: 'KES',
  balance_after: 31500,
  reference: 'order-1:line-1:delivery:fee',
  description: 'Platform fee - Class sale share - Flower Gardening',
  created_date: '2026-10-20T11:05:00Z',
};

test('a sale share and its platform fee become one entry, net, with the two lines as its breakdown', () => {
  const [entry, ...rest] = statementEntries([fee, sale]);
  assert.ok(entry);

  assert.equal(rest.length, 0);
  assert.equal(entry.kind, 'in');
  assert.equal(entry.title, 'Class sale share · Flower Gardening');
  assert.equal(entry.amount, 31500);
  assert.equal(entry.balanceAfter, 31500);
  assert.deepEqual(
    entry.breakdown?.map(line => [line.label, line.amount, line.direction]),
    [
      ['Your share', 35000, 'in'],
      ['Platform fee', 3500, 'out'],
    ]
  );
  assert.deepEqual(entry.groups, ['in', 'fee']);
});

test('a share with no fee stays a plain credit', () => {
  const [entry] = statementEntries([sale]);
  assert.ok(entry);

  assert.equal(entry.amount, 35000);
  assert.equal(entry.breakdown, undefined);
  assert.deepEqual(entry.groups, ['in']);
});

test('a reversal and a transfer out are money out; the reversal carries its status', () => {
  const entries = statementEntries([
    { ...sale, uuid: 'r1', transaction_type: 'SALE_REVERSAL', amount: 93600, balance_after: 0, reference: 'o:l:reversal', description: 'Moved to the hiring organisation - AI' },
    { ...sale, uuid: 'o1', transaction_type: 'TRANSFER_OUT', amount: 1000, balance_after: 34000, reference: 'gift', description: 'Gift' },
  ]);

  assert.deepEqual(entries.map(e => [e.kind, e.direction, e.status ?? null]), [
    ['reversal', 'out', 'Reversed'],
    ['out', 'out', null],
  ]);
  assert.deepEqual(entries[0]!.groups, ['out']);
});

test('orders become payments: paid ones offer a receipt, waiting ones offer to finish paying', () => {
  const entries = orderEntries([
    { id: 'a', display_id: '2', payment_status: 'AWAITING_PAYMENT', currency_code: 'KES', total: 49500, created_at: '2026-08-24T15:33:00Z', items: [{ id: 'l', title: 'Saturday Test Class', quantity: 1, total: 49500 }] },
    { id: 'b', display_id: '23', payment_status: 'CAPTURED', currency_code: 'KES', total: 10000, created_at: '2026-10-17T20:19:30Z', items: [{ id: 'm', title: 'AI and ML', quantity: 1, total: 10000 }] },
  ]);

  assert.deepEqual(entries.map(e => [e.kind, e.title, e.status, e.action]), [
    ['waiting', 'Saturday Test Class', 'Awaiting payment', 'pay'],
    ['payment', 'AI and ML', 'Paid', 'receipt'],
  ]);
  assert.equal(entries[1]!.meta, 'Order #23 · 17 Oct 2026, 23:19 · 1 seat');
  assert.deepEqual(entries[0]!.groups, ['wait']);
  assert.deepEqual(entries[1]!.groups, ['paid']);
});

test('a parent sees which child each order was for, and can filter by child', () => {
  const entries = orderEntries(
    [{ id: 'c', display_id: '26', payment_status: 'CAPTURED', currency_code: 'KES', total: 10000, created_at: '2026-10-18T06:12:00Z', items: [{ id: 'n', title: 'AI and ML', quantity: 1, total: 10000, metadata: { student_uuid: 's-1' } }] }],
    { childName: uuid => (uuid === 's-1' ? 'Jabari' : undefined) }
  );

  assert.equal(entries[0]!.meta, 'For Jabari · Order #26 · 18 Oct 2026, 09:12 · 1 seat');
  assert.deepEqual(entries[0]!.groups, ['paid', 'child:s-1']);
});

test('obligations are owed until settled, and only an organisation can settle them', () => {
  const owed = { uuid: 'ob1', rate_amount: 10500, currency_code: 'KES', status: 'ACCRUED', accrued_at: '2026-10-14T09:00:00Z' };
  const settled = { ...owed, uuid: 'ob2', status: 'SETTLED', settlement_reference: 'QJK8L2' };

  const forOrganisation = obligationEntries([owed, settled], { title: () => 'C. Chebet · AI', canSettle: true });
  const forInstructor = obligationEntries([owed], { title: () => 'Eldoret Institute · AI', canSettle: false });

  assert.deepEqual(forOrganisation.map(e => [e.status, e.action ?? null]), [
    ['Owed', 'settle'],
    ['Settled', null],
  ]);
  assert.equal(forInstructor[0]!.action, undefined);
  assert.equal(forInstructor[0]!.amount, 10500);
});

test('filtering keeps the entries in a group; "all" keeps everything', () => {
  const entries = statementEntries([fee, sale, { ...sale, uuid: 'x', reference: 'other' }]);

  assert.equal(filterEntries(entries, 'all').length, 2);
  assert.equal(filterEntries(entries, 'fee').length, 1);
  assert.equal(filterEntries(entries, 'out').length, 0);
});
