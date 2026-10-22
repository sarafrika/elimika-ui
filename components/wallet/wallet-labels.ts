/** Plain words for the wallet's transaction and audit codes. */

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  SALE: 'Sale share',
  PLATFORM_FEE: 'Platform fee',
  DEPOSIT: 'Deposit',
  TRANSFER_IN: 'Transfer in',
  TRANSFER_OUT: 'Transfer out',
  SALE_REVERSAL: 'Sale reversal',
  WITHDRAWAL: 'Withdrawal',
  WITHDRAWAL_REVERSAL: 'Withdrawal returned',
  PAYOUT_FEE: 'M-Pesa charge',
};

export const AUDIT_EVENT_LABELS: Record<string, string> = {
  DEPOSIT_RECORDED: 'Deposit recorded',
  SALE_SHARE_CREDITED: 'Sale share credited',
  PLATFORM_FEE_CHARGED: 'Platform fee charged',
  TRANSFER_SENT: 'Transfer sent',
  TRANSFER_RECEIVED: 'Transfer received',
  SALE_SHARE_REVERSED: 'Sale share reversed',
  PAYOUT_METHOD_ADDED: 'Payout number added',
  PAYOUT_METHOD_VERIFIED: 'Payout number verified',
  PAYOUT_METHOD_REMOVED: 'Payout number removed',
  PAYOUT_METHOD_DEFAULT_CHANGED: 'Default payout number changed',
  PAYOUT_APPROVER_ADDED: 'Payout approver added',
  PAYOUT_APPROVER_REMOVED: 'Payout approver removed',
  WITHDRAWAL_REQUESTED: 'Withdrawal requested',
  WITHDRAWAL_CONFIRMED: 'Withdrawal confirmed',
  WITHDRAWAL_HELD: 'Money held for withdrawal',
  WITHDRAWAL_SECOND_APPROVED: 'Second approver agreed',
  WITHDRAWAL_APPROVED: 'Withdrawal approved by Elimika',
  WITHDRAWAL_REJECTED: 'Withdrawal not approved',
  WITHDRAWAL_PAID: 'Withdrawal paid',
  WITHDRAWAL_FAILED: 'Withdrawal failed',
  WITHDRAWAL_REVERSED: 'Withdrawal money returned',
  WITHDRAWAL_CANCELLED: 'Withdrawal cancelled',
  PAYOUT_FEE_CHARGED: 'M-Pesa charge taken',
};

const titleCase = (code: string) =>
  code
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase());

export const transactionTypeLabel = (code?: string | null) =>
  code ? (TRANSACTION_TYPE_LABELS[code] ?? titleCase(code)) : 'Transaction';

export const auditEventLabel = (code?: string | null) =>
  code ? (AUDIT_EVENT_LABELS[code] ?? titleCase(code)) : 'Wallet event';

/** "October 2026" for "2026-10". */
export function monthLabel(month?: string | null) {
  if (!month) return '—';
  const [year, m] = month.split('-').map(Number);
  if (!year || !m) return month;
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, m - 1, 1))
  );
}

/** First and last day of a "YYYY-MM" month, as ISO dates. */
export function monthRange(month: string) {
  const [year, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year ?? 1970, m ?? 1, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}
