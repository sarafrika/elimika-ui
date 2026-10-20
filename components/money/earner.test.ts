import assert from 'node:assert/strict';
import { test } from 'node:test';
import { earnerTotals } from './earner';

test('shares, fees and sale count come from the statement; a reversal takes its sale back out', () => {
  const totals = earnerTotals([
    { transaction_type: 'PLATFORM_FEE', amount: 3500 },
    { transaction_type: 'SALE', amount: 35000 },
    { transaction_type: 'SALE_REVERSAL', amount: 93600 },
    { transaction_type: 'SALE', amount: 93600 },
    { transaction_type: 'TRANSFER_OUT', amount: 1000 },
  ]);

  assert.deepEqual(totals, { shares: 35000, fees: 3500, sales: 1 });
});

test('an empty statement is all zeros', () => {
  assert.deepEqual(earnerTotals([]), { shares: 0, fees: 0, sales: 0 });
});
