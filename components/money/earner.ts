import type { StatementTransaction } from './ledger';

/** The statement filter every earner (instructor, course creator, organisation) gets. */
export const EARNER_FILTERS = [
  { id: 'all', label: 'All activity' },
  { id: 'in', label: 'Sale shares' },
  { id: 'fee', label: 'Platform fees' },
  { id: 'out', label: 'Money out' },
];

/** Gross sale shares, platform fees charged on them, and how many sales, from a wallet statement. */
export function earnerTotals(transactions: StatementTransaction[]) {
  let shares = 0;
  let fees = 0;
  let sales = 0;
  for (const txn of transactions) {
    if (txn.transaction_type === 'SALE') {
      shares += Number(txn.amount ?? 0);
      sales += 1;
    } else if (txn.transaction_type === 'SALE_REVERSAL') {
      shares -= Number(txn.amount ?? 0);
      sales -= 1;
    } else if (txn.transaction_type === 'PLATFORM_FEE') {
      fees += Number(txn.amount ?? 0);
    }
  }
  return { shares, fees, sales: Math.max(sales, 0) };
}
