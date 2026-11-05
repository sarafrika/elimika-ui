import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classCardFacts, classTotal, formatKes } from './class-card-facts';

const session = (start: string, end: string, status = 'SCHEDULED') => ({
  start_time: new Date(start),
  end_time: new Date(end),
  status,
}) as never;

const NOW = new Date('2026-11-05T08:00:00Z');

test('per-hour classes cost the rate times scheduled hours, as the cart charges', () => {
  const sessions = [
    session('2026-11-10T07:00:00Z', '2026-11-10T08:30:00Z'),
    session('2026-11-11T07:00:00Z', '2026-11-11T08:00:00Z'),
  ];
  const { total, breakdown } = classTotal(1750, 'per_hour', sessions);
  assert.equal(total, 4375);
  assert.equal(breakdown, 'KES 1,750/h × 2.5 h');
});

test('cancelled sessions are not charged and per-session classes count sessions', () => {
  const sessions = [
    session('2026-11-10T07:00:00Z', '2026-11-10T08:00:00Z'),
    session('2026-11-11T07:00:00Z', '2026-11-11T08:00:00Z', 'CANCELLED'),
  ];
  assert.equal(classTotal(500, 'per_session', sessions).total, 500);
});

test('with nothing scheduled the price is the unit price alone', () => {
  assert.deepEqual(classTotal(2000, 'per_hour', []), { total: 2000, breakdown: null });
});

test('a class whose sessions are all past is closed', () => {
  const facts = classCardFacts(
    { sale_price: 1750, rate_basis: 'per_hour', location_type: 'ONLINE' } as never,
    [session('2026-08-18T22:00:00Z', '2026-08-18T23:00:00Z')],
    undefined,
    NOW
  );
  assert.equal(facts.closed, true);
  assert.equal(facts.closedReason, 'ended');
});

test('registration ending within three days is closing soon and the venue wins over online', () => {
  const facts = classCardFacts(
    {
      sale_price: 1500,
      rate_basis: 'per_hour',
      location_type: 'IN_PERSON',
      location_name: 'Daystar University',
      registration_period_end_date: new Date('2026-11-06T00:00:00Z'),
    } as never,
    [session('2026-11-09T15:00:00Z', '2026-11-09T16:30:00Z')],
    { seats_remaining: 3, max_participants: 12 } as never,
    NOW
  );
  assert.equal(facts.closingSoon, true);
  assert.equal(facts.where, 'Daystar University');
  assert.equal(facts.seatsLeft, 3);
  assert.equal(facts.startsThisWeek, true);
});

test('prices format as whole shillings', () => {
  assert.equal(formatKes(10500), 'KES 10,500');
  assert.equal(formatKes(null), 'Price on request');
});
