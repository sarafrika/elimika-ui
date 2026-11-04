/**
 * How one sold line was split: the creator's share, the delivery share (instructor or
 * school), each share's platform fee, and what Elimika kept. Typed by hand from the
 * backend's SaleSplitDTO (sarafrika/elimika `feat/order-split-breakdown`) until the
 * client is regenerated.
 */

type Amount = number | string | null | undefined;

/** Root of the hand-written wallet query keys, so `invalidateWallet` refreshes them with the rest. */
export const WALLET_SALES_KEY = 'wallet-sales';

export type SplitRole = 'COURSE_CREATOR' | 'INSTRUCTOR' | 'ORGANISATION';
export type LegStatus = 'PAID' | 'NO_EARNER' | 'NO_SHARE' | 'NOT_SPLIT';

export interface SaleSplitLeg {
  role?: string | null;
  name?: string | null;
  owner_type?: string | null;
  /** Null for the other party: only your own side is identified. */
  owner_uuid?: string | null;
  status?: string | null;
  gross?: Amount;
  fee?: Amount;
  net?: Amount;
}

export interface SaleSplitFeeRule {
  description?: string | null;
  recorded?: boolean | null;
  rule_uuid?: string | null;
  rule_key?: string | null;
  mode?: string | null;
  rate?: Amount;
  rate_currency?: string | null;
  waived?: boolean | null;
  discount_percentage?: Amount;
  discount_amount?: Amount;
  evaluated_at?: string | null;
}

export interface SaleSplitTransaction {
  uuid?: string | null;
  wallet_uuid?: string | null;
  transaction_type?: string | null;
  role?: string | null;
  reference?: string | null;
  amount?: Amount;
  purse?: string | null;
}

export interface SaleSplit {
  uuid: string;
  order_id?: string | null;
  order_number?: string | null;
  line_item_id?: string | null;
  title?: string | null;
  course_uuid?: string | null;
  class_definition_uuid?: string | null;
  captured_at?: string | null;
  currency_code?: string | null;
  line_gross?: Amount;
  creator_percentage?: Amount;
  your_role?: string | null;
  your_purse?: string | null;
  your_gross?: Amount;
  your_fee?: Amount;
  your_net?: Amount;
  creator?: SaleSplitLeg | null;
  delivery?: SaleSplitLeg | null;
  platform_fee_total?: Amount;
  retained?: Amount;
  reconciles?: boolean | null;
  backfilled?: boolean | null;
  fee_rule?: SaleSplitFeeRule | null;
  transactions?: SaleSplitTransaction[] | null;
}

export const toNumber = (value: Amount): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const ROLE_LABELS: Record<SplitRole, string> = {
  COURSE_CREATOR: 'Course creator',
  INSTRUCTOR: 'Instructor',
  ORGANISATION: 'School',
};

export const roleLabel = (role?: string | null) =>
  role && role in ROLE_LABELS ? ROLE_LABELS[role as SplitRole] : 'Earner';

/** Plain words for a share that was not paid to anyone; null when it was paid. */
export const LEG_STATUS_REASONS: Record<Exclude<LegStatus, 'PAID'>, string> = {
  NO_EARNER: 'nobody was set to receive this share, so Elimika kept it',
  NO_SHARE: 'no share of this line was set for this role',
  NOT_SPLIT: 'this line was not split between earners',
};

export function legReason(status?: string | null): string | null {
  if (!status || status === 'PAID') return null;
  return LEG_STATUS_REASONS[status as Exclude<LegStatus, 'PAID'>] ?? null;
}

export interface LegView {
  key: 'creator' | 'delivery';
  heading: string;
  name: string | null;
  percentage: number | null;
  gross: number | null;
  fee: number | null;
  net: number | null;
  status: string;
  reason: string | null;
  mine: boolean;
}

/**
 * The two shares as the breakdown lists them. The creator's percentage comes from the
 * server; the delivery side is the rest of the line.
 */
export function splitLegs(split: SaleSplit): LegView[] {
  const creatorPct = toNumber(split.creator_percentage);
  const deliveryRole = split.delivery?.role ?? null;
  const legs: [LegView['key'], SaleSplitLeg | null | undefined, string, number | null][] = [
    ['creator', split.creator, 'Course creator share', creatorPct],
    [
      'delivery',
      split.delivery,
      `${deliveryRole === 'ORGANISATION' ? 'School' : deliveryRole === 'INSTRUCTOR' ? 'Instructor' : 'Delivery'} share`,
      creatorPct === null ? null : Math.max(0, 100 - creatorPct),
    ],
  ];
  return legs.map(([key, leg, heading, percentage]) => ({
    key,
    heading,
    name: leg?.name ?? null,
    percentage,
    gross: toNumber(leg?.gross),
    fee: toNumber(leg?.fee),
    net: toNumber(leg?.net),
    status: leg?.status ?? 'NOT_SPLIT',
    reason: legReason(leg?.status),
    mine: Boolean(split.your_role) && leg?.role === split.your_role,
  }));
}

/** Why Elimika kept part of the line, one sentence per unpaid share. */
export function retainedReasons(split: SaleSplit): string[] {
  return splitLegs(split).flatMap(leg => (leg.reason ? [`${leg.heading}: ${leg.reason}.`] : []));
}

/** "40%" or "33.33%"; null when unknown. */
export function formatPercent(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.round(value * 100) / 100;
  return `${rounded}%`;
}

/** Notes the breakdown must show beside the figures. */
export function splitNotes(split: SaleSplit) {
  return {
    mismatch: split.reconciles === false,
    backfilled: Boolean(split.backfilled),
    feeRuleRecorded: split.fee_rule?.recorded !== false,
  };
}
