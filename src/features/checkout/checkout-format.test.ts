import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatAmount, formatCountdown, maskMsisdn, normalizeMsisdn } from './checkout-format';

test('amounts are whole shillings with separators, never four decimals', () => {
  assert.equal(formatAmount('10500.0000'), 'KES 10,500');
  assert.equal(formatAmount(1), 'KES 1');
  assert.equal(formatAmount(undefined), 'KES 0');
});

test('kenyan numbers normalise to 254 form and reject the rest', () => {
  assert.equal(normalizeMsisdn('0712 345 678'), '254712345678');
  assert.equal(normalizeMsisdn('+254 112 345 678'), '254112345678');
  assert.equal(normalizeMsisdn('712345678'), '254712345678');
  assert.equal(normalizeMsisdn('0812345678'), null);
});

test('numbers are only ever shown masked', () => {
  assert.equal(maskMsisdn('254712345678'), '0712 *** 678');
  assert.equal(maskMsisdn('garbage'), '');
});

test('countdown reads as minutes and seconds', () => {
  assert.equal(formatCountdown(42), '0:42');
  assert.equal(formatCountdown(-3), '0:00');
});
