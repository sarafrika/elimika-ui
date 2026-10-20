import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatMoney, formatMoneyDate, formatSignedMoney } from './format';

test('money is the currency code, grouped digits and no cents unless there are some', () => {
  assert.equal(formatMoney(12500), 'KES 12,500');
  assert.equal(formatMoney('40599.6000'), 'KES 40,599.60');
  assert.equal(formatMoney(0), 'KES 0');
  assert.equal(formatMoney(31500, 'USD'), 'USD 31,500');
});

test('a missing amount reads as a dash rather than zero', () => {
  assert.equal(formatMoney(null), '—');
  assert.equal(formatMoney(undefined), '—');
  assert.equal(formatMoney('not a number'), '—');
});

test('signed money uses a true minus sign for money out', () => {
  assert.equal(formatSignedMoney(2700, 'in'), '+ KES 2,700');
  assert.equal(formatSignedMoney(300, 'out'), '− KES 300');
});

test('dates read as day, short month, year and time in East Africa Time', () => {
  assert.equal(formatMoneyDate('2026-10-17T20:19:30Z'), '17 Oct 2026, 23:19');
  assert.equal(formatMoneyDate(null), '—');
});
