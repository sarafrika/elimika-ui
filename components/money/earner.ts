/** The statement filter every earner (instructor, course creator, organisation) gets. */
export const EARNER_FILTERS = [
  { id: 'all', label: 'All activity' },
  { id: 'in', label: 'Sale shares' },
  { id: 'fee', label: 'Platform fees' },
  { id: 'out', label: 'Money out' },
];

export interface WalletTotalsLike {
  shares_total?: number | string | null;
  platform_fees_total?: number | string | null;
  sales_count?: number | bigint | string | null;
  transferred_out_total?: number | string | null;
}

/** Lifetime figures the API sums over the whole wallet, so a long statement is never undercounted. */
export function earnerTotals(wallet: WalletTotalsLike | null | undefined) {
  const n = (value: number | bigint | string | null | undefined) => Number(value ?? 0);
  return {
    shares: n(wallet?.shares_total),
    fees: n(wallet?.platform_fees_total),
    sales: n(wallet?.sales_count),
    transferredOut: n(wallet?.transferred_out_total),
  };
}
