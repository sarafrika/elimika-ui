import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cellKey,
  normaliseRateCard,
  RATE_BASES,
  type RateCardInput,
  TRAINING_METHODS,
  validateRateCard,
} from './rate-card';

test('every training method accepts hourly only, daily only, or both', () => {
  for (const method of TRAINING_METHODS) {
    for (const bases of [[RATE_BASES[0]!], [RATE_BASES[1]!], RATE_BASES]) {
      const card: RateCardInput = { currency: 'KES' };
      for (const basis of bases) card[cellKey(method, basis)] = 500;
      assert.equal(validateRateCard(card, 100, [method.prefix]).valid, true);
      const payload = normaliseRateCard(card);
      for (const basis of RATE_BASES) {
        assert.equal(payload[cellKey(method, basis)], bases.includes(basis) ? 500 : null);
      }
    }
  }
});

test('each enabled method requires its own rate even when another method has a rate', () => {
  const result = validateRateCard({ private_online_hourly_rate: 500 }, 100, [
    'private_online',
    'group_online',
  ]);
  assert.equal(result.valid, false);
  assert.deepEqual(result.cells, {});
  assert.deepEqual(result.card, ['Group online: enter a per-hour rate, a per-day rate, or both.']);
});

test('an empty card is rejected and supplied rates must meet the minimum', () => {
  assert.equal(validateRateCard({}).valid, false);
  for (const rate of [-1, 50]) {
    const result = validateRateCard({ private_online_daily_rate: rate }, 100);
    assert.equal(result.valid, false);
    assert.ok(result.cells.private_online_daily_rate);
    assert.equal(result.cells.private_online_hourly_rate, undefined);
  }
});
