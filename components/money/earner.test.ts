import assert from 'node:assert/strict';
import { test } from 'node:test';
import { earnerTotals } from './earner';

test('lifetime totals are read from the wallet the API returns', () => {
  assert.deepEqual(
    earnerTotals({ shares_total: 142200, platform_fees_total: '300.0000', sales_count: 7, transferred_out_total: 0 }),
    { shares: 142200, fees: 300, sales: 7, transferredOut: 0 }
  );
});

test('a missing wallet reads as zeros', () => {
  assert.deepEqual(earnerTotals(undefined), { shares: 0, fees: 0, sales: 0, transferredOut: 0 });
});
