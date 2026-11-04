/**
 * Role purses. A person's wallet holds a COURSE_CREATOR, an INSTRUCTOR and a STUDENT
 * purse, each with its own balance; an organisation's holds one EARNINGS purse. Each
 * role's dashboard shows its own purse. STUDENT money can be spent on Elimika but not
 * withdrawn, and nothing moves out of it.
 *
 * The purse fields postdate the last client regeneration, so they are typed here by
 * hand from the backend contract (sarafrika/elimika `feat/role-purses`).
 */

export const PURSES = ['COURSE_CREATOR', 'INSTRUCTOR', 'STUDENT', 'EARNINGS'] as const;
export type Purse = (typeof PURSES)[number];
export const PERSON_PURSES: Purse[] = ['COURSE_CREATOR', 'INSTRUCTOR', 'STUDENT'];

export const PURSE_LABELS: Record<Purse, string> = {
  COURSE_CREATOR: 'Course creator purse',
  INSTRUCTOR: 'Instructor purse',
  STUDENT: 'Student purse',
  EARNINGS: 'Earnings purse',
};

export const STUDENT_PURSE_NOTE = 'Student funds can be spent on Elimika but not withdrawn.';

export const isPurse = (value: unknown): value is Purse =>
  typeof value === 'string' && (PURSES as readonly string[]).includes(value);

export const purseLabel = (purse?: string | null) => (isPurse(purse) ? PURSE_LABELS[purse] : null);

/** The purse a dashboard shows; null where a dashboard has no purse of its own (admin, parent). */
export function purseForDomain(domain?: string | null): Purse | null {
  switch (domain) {
    case 'course_creator':
      return 'COURSE_CREATOR';
    case 'instructor':
      return 'INSTRUCTOR';
    case 'student':
      return 'STUDENT';
    case 'organisation':
    case 'organisation_user':
      return 'EARNINGS';
    default:
      return null;
  }
}

/** Whether money in this purse may be sent to M-Pesa. The server still decides with can_withdraw. */
export const canWithdrawFrom = (purse?: Purse | null) => purse !== 'STUDENT';

/** A person may move money out of an earning purse into any other of their own purses, never out of STUDENT. */
export function canMove(from?: Purse | null, to?: Purse | null) {
  if (!from || !to || from === to) return false;
  if (from === 'STUDENT' || from === 'EARNINGS' || to === 'EARNINGS') return false;
  return PERSON_PURSES.includes(from) && PERSON_PURSES.includes(to);
}

/** Purses money can come from in the move dialog. */
export const MOVE_SOURCES: Purse[] = PERSON_PURSES.filter(purse => purse !== 'STUDENT');

export const moveTargets = (from: Purse) => PERSON_PURSES.filter(to => canMove(from, to));

type Amount = number | string | bigint | null | undefined;

/** One purse as GET /wallets/{u} or /organisations/{o}/wallet lists it. */
export interface PurseSummary {
  purse?: string | null;
  wallet_uuid?: string | null;
  currency_code?: string | null;
  balance_amount?: Amount;
  held_amount?: Amount;
  available_amount?: Amount;
  account_balance?: Amount;
  shares_total?: Amount;
  platform_fees_total?: Amount;
  sales_count?: Amount;
  transferred_out_total?: Amount;
}

/** The wallet response with its purses; the top-level figures are sums over them. */
export interface WalletWithPurses extends PurseSummary {
  can_withdraw?: boolean | null;
  purses?: PurseSummary[] | null;
}

export interface WalletFigures {
  currency: string;
  /** What the purse holds, held money included. */
  account: number;
  balance: number;
  held: number;
  available: number;
  canWithdraw: boolean;
  shares: number;
  fees: number;
  sales: number;
  transferredOut: number;
}

const n = (value: Amount) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

function figuresOf(source: PurseSummary, currency: string, canWithdraw: boolean): WalletFigures {
  const balance = n(source.balance_amount);
  const held = n(source.held_amount);
  return {
    currency: source.currency_code ?? currency,
    account: source.account_balance == null ? balance + held : n(source.account_balance),
    balance,
    held,
    available: source.available_amount == null ? balance : n(source.available_amount),
    canWithdraw,
    shares: n(source.shares_total),
    fees: n(source.platform_fees_total),
    sales: n(source.sales_count),
    transferredOut: n(source.transferred_out_total),
  };
}

/**
 * The figures a dashboard shows: its own purse when the wallet lists purses. A wallet
 * read before purses existed has no list, so its totals stand in for the purse.
 * A purse the wallet does not list yet reads as empty.
 */
export function purseFigures(wallet: WalletWithPurses | null | undefined, purse?: Purse | null): WalletFigures | null {
  if (!wallet) return null;
  const currency = wallet.currency_code ?? 'KES';
  const serverAllows = Boolean(wallet.can_withdraw);
  const list = wallet.purses;
  if (!purse || !Array.isArray(list)) return figuresOf(wallet, currency, serverAllows && canWithdrawFrom(purse));
  const entry = list.find(item => item.purse === purse) ?? { purse, currency_code: currency };
  return figuresOf(entry, currency, serverAllows && canWithdrawFrom(purse));
}

/** Every purse's balance, for the wallet menu's "All purses" breakdown. */
export function purseBalances(wallet: WalletWithPurses | null | undefined) {
  const currency = wallet?.currency_code ?? 'KES';
  const purses = (wallet?.purses ?? []).flatMap(item =>
    isPurse(item.purse) ? [{ purse: item.purse, label: PURSE_LABELS[item.purse], ...figuresOf(item, currency, false) }] : []
  );
  const total = wallet ? figuresOf(wallet, currency, false).account : 0;
  return { currency, total, purses };
}

/** Purses the move dialog may take money from, with what each has available. */
export function movableSources(wallet: WalletWithPurses | null | undefined) {
  return MOVE_SOURCES.map(purse => ({ purse, available: purseFigures(wallet, purse)?.available ?? 0 })).filter(
    source => source.available > 0
  );
}

/** Why a move cannot go ahead, or null when it can. */
export function moveProblem(from: Purse | null, to: Purse | null, amount: number, available: number): string | null {
  if (!from || !to) return 'Choose where the money comes from and where it goes.';
  if (from === 'STUDENT') return 'Money in your Student purse can be spent but not moved out.';
  if (!canMove(from, to)) return 'Choose two different purses.';
  if (!Number.isFinite(amount) || amount <= 0) return 'Enter an amount above zero.';
  if (amount > available) return 'That is more than this purse has available.';
  return null;
}
