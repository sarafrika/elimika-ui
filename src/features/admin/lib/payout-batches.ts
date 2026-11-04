import type { Withdrawal } from '@/services/client/types.gen';

/**
 * Payout batches: every approved withdrawal is paid through one. One admin builds and
 * submits a batch, a different admin approves it, and approval is refused when the
 * batch total is more than the payout paybill's float.
 *
 * The endpoints postdate the last client regeneration, so these types are written by
 * hand from the backend contract. Replace them with the generated ones once
 * `pnpm openapi-ts` picks the batch endpoints up.
 */

export type PayoutBatchStatus =
  | 'DRAFT'
  | 'AWAITING_APPROVAL'
  | 'RELEASED'
  | 'COMPLETED'
  | 'PARTLY_FAILED'
  | 'REJECTED'
  | 'CANCELLED';

export interface PayoutBatch {
  uuid: string;
  status: PayoutBatchStatus;
  created_by?: string | null;
  created_by_name?: string | null;
  submitted_by?: string | null;
  submitted_by_name?: string | null;
  submitted_at?: string | null;
  approved_by?: string | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  row_count?: number | null;
  total_amount?: number | string | null;
  paid_count?: number | null;
  failed_count?: number | null;
  in_flight_count?: number | null;
  float_at_approval?: number | string | null;
  released_at?: string | null;
  completed_at?: string | null;
  created_date?: string | null;
  updated_date?: string | null;
  can_approve?: boolean | null;
  /** Rows whose wallet check raised a flag; approving needs `acknowledge_wallet_issues`. */
  wallet_issue_count?: number | null;
  /** Rows whose wallet the server could check. */
  wallets_checked?: number | null;
}

export type WalletFlag = 'LEDGER_MISMATCH' | 'WALLET_SHORT';

/** The earner's wallet as the server read it when it listed the withdrawal. */
export interface WalletCheck {
  account_balance?: number | string | null;
  held_amount?: number | string | null;
  held_count?: number | null;
  /** Withdrawal and fee debits actually recorded for the held withdrawals. */
  held_debited_amount?: number | string | null;
  available_balance?: number | string | null;
  balance_after?: number | string | null;
  ledger_balance?: number | string | null;
  ledger_matches?: boolean | null;
  covers?: boolean | null;
  checked_at?: string | null;
}

/**
 * A withdrawal as the admin endpoints return it, with its batch and wallet check. The
 * wallet fields are hand-written too until the client is regenerated.
 */
export type BatchWithdrawal = Omit<
  Withdrawal,
  'created_date' | 'confirmed_at' | 'sent_at' | 'completed_at'
> & {
  payout_batch_uuid?: string | null;
  wallet_check?: WalletCheck | null;
  wallet_flags?: string[] | null;
  created_date?: string | Date | null;
  confirmed_at?: string | Date | null;
  sent_at?: string | Date | null;
  completed_at?: string | Date | null;
};

/** The payout paybill's balances as M-Pesa last reported them. */
export interface PayoutFloat {
  utility_funds?: number | string | null;
  working_funds?: number | string | null;
  reported_at?: string | null;
}

export interface PayoutBatchDetail extends PayoutBatch {
  withdrawals?: BatchWithdrawal[];
  payout_float?: PayoutFloat | null;
}

/* Status groups ---------------------------------------------------------------------- */

export const BATCH_GROUPS = ['drafts', 'awaiting', 'progress', 'done', 'closed'] as const;
export type BatchGroup = (typeof BATCH_GROUPS)[number];

export const BATCH_GROUP_STATUSES: Record<BatchGroup, PayoutBatchStatus[]> = {
  drafts: ['DRAFT'],
  awaiting: ['AWAITING_APPROVAL'],
  progress: ['RELEASED'],
  done: ['COMPLETED', 'PARTLY_FAILED'],
  closed: ['REJECTED', 'CANCELLED'],
};

export const BATCH_GROUP_LABELS: Record<BatchGroup, string> = {
  drafts: 'Drafts',
  awaiting: 'Awaiting approval',
  progress: 'In progress',
  done: 'Done',
  closed: 'Closed',
};

/** The list tab a batch belongs on. */
export function batchGroupOf(status: string | null | undefined): BatchGroup | undefined {
  return BATCH_GROUPS.find(group =>
    (BATCH_GROUP_STATUSES[group] as string[]).includes(status ?? '')
  );
}

export const BATCH_STATUS: Record<
  PayoutBatchStatus,
  { label: string; tone: 'success' | 'warning' | 'destructive' | 'info' | 'neutral' }
> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  AWAITING_APPROVAL: { label: 'Awaiting approval', tone: 'warning' },
  RELEASED: { label: 'Paying out', tone: 'info' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  PARTLY_FAILED: { label: 'Partly failed', tone: 'destructive' },
  REJECTED: { label: 'Rejected', tone: 'destructive' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};

/* Money ------------------------------------------------------------------------------ */

/** "1 withdrawal", "2 withdrawals". */
export function plural(count: number, word: string, many = `${word}s`): string {
  return `${count} ${count === 1 ? word : many}`;
}

export function toAmount(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Sum in cents so a long selection does not drift by floating-point error. */
export function sumAmounts(values: Iterable<number | string | null | undefined>): number {
  let cents = 0;
  for (const value of values) cents += Math.round((toAmount(value) ?? 0) * 100);
  return cents / 100;
}

/* Float ------------------------------------------------------------------------------ */

export type FloatState =
  | { kind: 'enough'; float: number; spare: number }
  | { kind: 'short'; float: number; shortBy: number }
  | { kind: 'unknown' };

/**
 * Whether the payout paybill can cover a batch. B2C pays from the utility account, so
 * that is the float; when M-Pesa has not reported it yet the state is unknown.
 */
export function floatState(
  total: number | string | null | undefined,
  float: PayoutFloat | null | undefined
): FloatState {
  const available = toAmount(float?.utility_funds);
  if (available === null) return { kind: 'unknown' };
  const need = toAmount(total) ?? 0;
  const gap = sumAmounts([available, -need]);
  return gap >= 0
    ? { kind: 'enough', float: available, spare: gap }
    : { kind: 'short', float: available, shortBy: -gap };
}

/* Wallet check ----------------------------------------------------------------------- */

export const WALLET_FLAG_LABELS: Record<WalletFlag, string> = {
  LEDGER_MISMATCH: 'Ledger mismatch',
  WALLET_SHORT: 'Wallet short',
};

const WALLET_FLAG_ORDER: WalletFlag[] = ['LEDGER_MISMATCH', 'WALLET_SHORT'];

/**
 * A row's wallet flags: the server's list, plus any its wallet check implies, so a
 * mismatch still shows if the two ever disagree. Unknown flags are dropped.
 */
export function walletFlagsOf(
  row: Pick<BatchWithdrawal, 'wallet_check' | 'wallet_flags'>
): WalletFlag[] {
  const found = new Set(row.wallet_flags ?? []);
  if (row.wallet_check?.ledger_matches === false) found.add('LEDGER_MISMATCH');
  if (row.wallet_check?.covers === false) found.add('WALLET_SHORT');
  return WALLET_FLAG_ORDER.filter(flag => found.has(flag));
}

/** How far the wallet's balance is from its ledger, or null when either is unknown. */
/** The ledger mirrors the wallet's available balance (held money has already left it). */
export function ledgerGap(check: WalletCheck | null | undefined): number | null {
  const balance = toAmount(check?.available_balance);
  const ledger = toAmount(check?.ledger_balance);
  if (balance === null || ledger === null) return null;
  return Math.abs(sumAmounts([balance, -ledger]));
}

export type WalletSummary =
  | { kind: 'unchecked' }
  | { kind: 'clear'; checked: number; unchecked: number }
  | {
      kind: 'issues';
      issues: number;
      total: number;
      flags: { flag: WalletFlag; count: number }[];
    };

/**
 * The batch's wallets in one line. The server's counts win; the rows fill in when an
 * older response lacks them.
 */
export function walletSummary(
  batch: Pick<PayoutBatch, 'row_count' | 'wallet_issue_count' | 'wallets_checked'>,
  rows: Pick<BatchWithdrawal, 'wallet_check' | 'wallet_flags'>[]
): WalletSummary {
  const total = Math.max(Number(batch.row_count ?? 0), rows.length);
  const rowFlags = rows.map(walletFlagsOf);
  const issues = Math.max(
    Number(batch.wallet_issue_count ?? 0),
    rowFlags.filter(flags => flags.length > 0).length
  );
  if (issues > 0) {
    const flags = WALLET_FLAG_ORDER.map(flag => ({
      flag,
      count: rowFlags.filter(list => list.includes(flag)).length,
    })).filter(entry => entry.count > 0);
    return { kind: 'issues', issues, total, flags };
  }
  const checked = Math.max(
    Number(batch.wallets_checked ?? 0),
    rows.filter(row => row.wallet_check).length
  );
  if (checked === 0) return { kind: 'unchecked' };
  return { kind: 'clear', checked, unchecked: Math.max(0, total - checked) };
}

/* Progress --------------------------------------------------------------------------- */

export interface BatchProgress {
  total: number;
  paid: number;
  failed: number;
  inFlight: number;
  /** Rows not yet sent to M-Pesa. */
  waiting: number;
}

export function batchProgress(
  batch: Pick<PayoutBatch, 'row_count' | 'paid_count' | 'failed_count' | 'in_flight_count'>
): BatchProgress {
  const total = Number(batch.row_count ?? 0);
  const paid = Number(batch.paid_count ?? 0);
  const failed = Number(batch.failed_count ?? 0);
  const inFlight = Number(batch.in_flight_count ?? 0);
  return { total, paid, failed, inFlight, waiting: Math.max(0, total - paid - failed - inFlight) };
}

/** A batch the screen should keep polling: money is still moving. */
export function isBatchLive(
  batch: Pick<PayoutBatch, 'status' | 'in_flight_count'> | null | undefined
): boolean {
  if (!batch) return false;
  return batch.status === 'RELEASED' || Number(batch.in_flight_count ?? 0) > 0;
}

/* Approval --------------------------------------------------------------------------- */

/**
 * Why the approve button is off, or null when it is on. The server decides `can_approve`;
 * this only words its answer. An unknown float does not block here: the confirm dialog
 * asks for the explicit override instead.
 */
export function approveBlockReason(
  batch: Pick<PayoutBatch, 'status' | 'can_approve' | 'created_by' | 'submitted_by'>,
  float: FloatState,
  viewerUuid?: string | null
): string | null {
  if (batch.status !== 'AWAITING_APPROVAL')
    return 'Only a batch awaiting approval can be approved.';
  if (!batch.can_approve) {
    const isMaker =
      Boolean(viewerUuid) && (viewerUuid === batch.created_by || viewerUuid === batch.submitted_by);
    return isMaker
      ? 'You made this batch — another admin must approve it.'
      : 'You can’t approve this batch — another admin must.';
  }
  if (float.kind === 'short') return 'The payout float is too low for this batch. Top it up first.';
  return null;
}

/**
 * Whether the confirm step may go ahead: an unknown float needs the override, and wallet
 * issues need the approver to say they checked those wallets.
 */
export function canConfirmApproval(
  float: FloatState,
  override: boolean,
  walletIssues = 0,
  walletsAcknowledged = false
): boolean {
  if (float.kind === 'short') return false;
  if (walletIssues > 0 && !walletsAcknowledged) return false;
  return float.kind === 'enough' || override;
}
