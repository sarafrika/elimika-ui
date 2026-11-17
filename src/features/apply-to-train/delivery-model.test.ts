import assert from 'node:assert/strict';
import test from 'node:test';
import { cellKey, RATE_BASES, TRAINING_METHODS } from '@/lib/rate-card';
import { type DeliveryDraft, deliveryRateCard, validateDelivery } from './delivery-model';

test('each delivery method accepts an hourly rate, a daily rate, or both', () => {
  for (const { prefix } of TRAINING_METHODS) {
    for (const bases of [[RATE_BASES[0]!], [RATE_BASES[1]!], RATE_BASES]) {
      const draft: DeliveryDraft = { methods: [prefix], card: { currency: 'KES' } };
      for (const basis of bases) draft.card[cellKey(prefix, basis)] = 500;
      assert.equal(validateDelivery(draft, 100).count, 0);
      const payload = deliveryRateCard(draft);
      for (const basis of RATE_BASES) {
        assert.equal(payload[cellKey(prefix, basis)], bases.includes(basis) ? 500 : null);
      }
    }
  }
});

test('each selected method needs its own offer, reported once for the method', () => {
  const result = validateDelivery({
    methods: ['private_online', 'group_online'],
    card: { private_online_daily_rate: 500 },
  }, null);

  assert.equal(result.count, 1);
  assert.deepEqual(result.cells, {});
  assert.deepEqual(result.methods, {
    group_online: 'Enter at least one rate: per hour or per day.',
  });
});

test('provided rates still respect the minimum fee without requiring the other field', () => {
  const result = validateDelivery({
    methods: ['private_online'],
    card: { private_online_daily_rate: 50 },
  }, 100);

  assert.equal(result.count, 1);
  assert.deepEqual(result.methods, {});
  assert.deepEqual(Object.keys(result.cells), ['private_online_daily_rate']);
});
