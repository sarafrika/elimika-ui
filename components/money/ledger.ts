import { formatMoneyDate } from './format';

/** Turns wallet transactions, orders and instructor obligations into one shape of ledger row. */

export type LedgerKind = 'in' | 'out' | 'reversal' | 'payment' | 'waiting';
export type LedgerAction = 'receipt' | 'pay' | 'settle';
export type Direction = 'in' | 'out';

export interface LedgerLine {
  label: string;
  amount: number;
  direction: Direction;
}

export interface LedgerEntry<T = unknown> {
  id: string;
  kind: LedgerKind;
  title: string;
  meta: string;
  amount: number;
  currency: string;
  /** Set on wallet rows: shown with a sign and coloured. Unset for payments and obligations. */
  direction?: Direction;
  balanceAfter?: number | null;
  /** A status word the StatusBadge resolves to a tone. */
  status?: string;
  breakdown?: LedgerLine[];
  action?: LedgerAction;
  /** Filter keys this entry belongs to. */
  groups: string[];
  source: T;
}

export interface StatementTransaction {
  uuid?: string;
  transaction_type?: string;
  amount?: number | string;
  currency_code?: string;
  balance_after?: number | string;
  reference?: string | null;
  description?: string | null;
  created_date?: string | Date | null;
}

const FEE = ':fee';
const MONEY_IN = new Set(['SALE', 'DEPOSIT', 'TRANSFER_IN']);
const num = (value: number | string | null | undefined) => Number(value ?? 0);
const readable = (description?: string | null) => (description ?? '').replace(/ - /g, ' · ').trim();

/** Newest first, as the API returns them; each sale share absorbs its `:fee` row. */
export function statementEntries(transactions: StatementTransaction[]): LedgerEntry<StatementTransaction>[] {
  const fees = new Map<string, StatementTransaction>();
  const sales = new Set<string>();
  for (const txn of transactions) {
    if (txn.transaction_type === 'PLATFORM_FEE' && txn.reference?.endsWith(FEE)) {
      fees.set(txn.reference.slice(0, -FEE.length), txn);
    }
    if (txn.transaction_type === 'SALE' && txn.reference) sales.add(txn.reference);
  }
  const entries: LedgerEntry<StatementTransaction>[] = [];

  for (const txn of transactions) {
    const type = txn.transaction_type ?? '';
    const currency = txn.currency_code ?? 'KES';
    const base = { id: txn.uuid ?? `${txn.reference}`, currency, meta: formatMoneyDate(txn.created_date), source: txn };

    // A fee whose sale is listed is shown inside that sale's breakdown instead.
    if (type === 'PLATFORM_FEE' && txn.reference?.endsWith(FEE) && sales.has(txn.reference.slice(0, -FEE.length))) {
      continue;
    }

    if (type === 'SALE' && txn.reference && fees.has(txn.reference)) {
      const fee = fees.get(txn.reference)!;
      entries.push({
        ...base,
        kind: 'in',
        direction: 'in',
        title: readable(txn.description),
        amount: num(txn.amount) - num(fee.amount),
        balanceAfter: num(fee.balance_after),
        breakdown: [
          { label: 'Your share', amount: num(txn.amount), direction: 'in' },
          { label: 'Platform fee', amount: num(fee.amount), direction: 'out' },
        ],
        groups: ['in', 'fee'],
      });
      continue;
    }

    if (type === 'SALE_REVERSAL') {
      entries.push({ ...base, kind: 'reversal', direction: 'out', title: readable(txn.description), amount: num(txn.amount),
        balanceAfter: num(txn.balance_after), status: 'Reversed', groups: ['out'] });
      continue;
    }

    const isIn = MONEY_IN.has(type);
    entries.push({
      ...base,
      kind: isIn ? 'in' : 'out',
      direction: isIn ? 'in' : 'out',
      title: readable(txn.description) || type,
      amount: num(txn.amount),
      balanceAfter: num(txn.balance_after),
      groups: isIn ? ['in'] : type === 'PLATFORM_FEE' ? ['fee', 'out'] : ['out'],
    });
  }
  return entries;
}

export interface OrderLike {
  id?: string;
  display_id?: string;
  payment_status?: string;
  currency_code?: string;
  total?: number | string;
  created_at?: string | Date | null;
  items?: { id?: string; title?: string; quantity?: number; total?: number | string; metadata?: Record<string, unknown> | null }[];
}

/** One row per order; a parent passes `childName` to say who each order was for. */
export function orderEntries(
  orders: OrderLike[],
  options: { childName?: (studentUuid: string) => string | undefined } = {}
): LedgerEntry<OrderLike>[] {
  return orders.map(order => {
    const items = order.items ?? [];
    const seats = items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
    const childUuid = items.map(item => item.metadata?.student_uuid).find(v => typeof v === 'string') as string | undefined;
    const child = childUuid ? options.childName?.(childUuid) : undefined;
    const captured = (order.payment_status ?? '').toUpperCase() === 'CAPTURED';
    const parts = [
      child ? `For ${child}` : null,
      `Order #${order.display_id ?? order.id}`,
      formatMoneyDate(order.created_at),
      `${seats} ${seats === 1 ? 'seat' : 'seats'}`,
    ].filter(Boolean);
    return {
      id: order.id ?? `${order.display_id}`,
      kind: captured ? 'payment' : 'waiting',
      title: items.map(item => item.title).filter(Boolean).join(', ') || `Order #${order.display_id}`,
      meta: parts.join(' · '),
      amount: num(order.total),
      currency: order.currency_code ?? 'KES',
      status: captured ? 'Paid' : 'Awaiting payment',
      action: captured ? 'receipt' : 'pay',
      groups: [captured ? 'paid' : 'wait', ...(childUuid ? [`child:${childUuid}`] : [])],
      source: order,
    };
  });
}

export interface ObligationLike {
  uuid?: string;
  rate_amount?: number | string;
  currency_code?: string;
  status?: string;
  accrued_at?: string | Date | null;
  settlement_reference?: string | null;
}

const OBLIGATION_STATUS: Record<string, string> = { ACCRUED: 'Owed', SETTLED: 'Settled', CANCELLED: 'Cancelled', DISPUTED: 'Disputed' };

/** Sessions an organisation owes an instructor for; only the organisation side may record payment. */
export function obligationEntries<T extends ObligationLike>(
  obligations: T[],
  options: { title: (obligation: T) => string; canSettle: boolean }
): LedgerEntry<T>[] {
  return obligations.map(obligation => {
    const status = OBLIGATION_STATUS[(obligation.status ?? '').toUpperCase()] ?? obligation.status ?? 'Owed';
    const owed = status === 'Owed';
    const meta = [`Session ${formatMoneyDate(obligation.accrued_at)}`,
      obligation.settlement_reference ? `Ref ${obligation.settlement_reference}` : null].filter(Boolean);
    return {
      id: obligation.uuid ?? '',
      kind: owed ? 'waiting' : 'payment',
      title: options.title(obligation),
      meta: meta.join(' · '),
      amount: num(obligation.rate_amount),
      currency: obligation.currency_code ?? 'KES',
      status,
      action: owed && options.canSettle ? 'settle' : undefined,
      groups: [owed ? 'owed' : 'settled'],
      source: obligation,
    };
  });
}

export function filterEntries<T>(entries: LedgerEntry<T>[], group: string): LedgerEntry<T>[] {
  return group === 'all' ? entries : entries.filter(entry => entry.groups.includes(group));
}
