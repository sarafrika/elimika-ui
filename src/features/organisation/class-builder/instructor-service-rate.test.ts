import assert from 'node:assert/strict';
import test from 'node:test';
import { cellKey, RATE_BASES, TRAINING_METHODS } from '@/lib/rate-card';
import { instructorServiceRate } from './instructor-service-rate';

const groupHourly = { format: 'GROUP', delivery: 'IN_PERSON', basis: 'per_hour' } as const;

test('a withheld rate card is unknown rather than missing an approved rate', () => {
  for (const card of [null, undefined]) {
    assert.deepEqual(instructorServiceRate(card, groupHourly), {
      status: 'unavailable',
      rate: null,
    });
  }
});

test('checks the exact service, delivery and rate basis when the card is visible', () => {
  for (const method of TRAINING_METHODS) {
    for (const basis of RATE_BASES) {
      const selection = {
        format: method.format,
        delivery: method.location === 'online' ? ('ONLINE' as const) : ('IN_PERSON' as const),
        basis: basis.value,
      };
      assert.deepEqual(instructorServiceRate({ [cellKey(method, basis)]: 500 }, selection), {
        status: 'approved',
        rate: 500,
      });
      assert.deepEqual(instructorServiceRate({}, selection), { status: 'missing', rate: null });
    }
  }
});

test('an approved rate for a different basis or service does not cover the selected one', () => {
  assert.equal(
    instructorServiceRate({ group_inperson_daily_rate: 500 }, groupHourly).status,
    'missing'
  );
  assert.equal(
    instructorServiceRate({ private_inperson_hourly_rate: 500 }, groupHourly).status,
    'missing'
  );
  assert.equal(
    instructorServiceRate({ group_online_hourly_rate: 500 }, groupHourly).status,
    'missing'
  );
});
