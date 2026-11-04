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
}

/** A withdrawal as the batch endpoints return it, with the batch it sits in. */
export type BatchWithdrawal = Omit<
  Withdrawal,
  'created_date' | 'confirmed_at' | 'sent_at' | 'completed_at'
> & {
  payout_batch_uuid?: string | null;
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

/** Whether the confirm step may go ahead with the current override choice. */
export function canConfirmApproval(float: FloatState, override: boolean): boolean {
  if (float.kind === 'short') return false;
  return float.kind === 'enough' || override;
}
