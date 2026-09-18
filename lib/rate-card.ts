import type { CourseTrainingRateCard, TrainingRateFloorFlags } from '@/services/client';

/** The 12-cell rate card shared by course and program training applications. */
export type RateCard = CourseTrainingRateCard;

/** Per-cell below-minimum flags the API sends the course or program owner. */
export type RateFloorFlags = TrainingRateFloorFlags;

/** The unit a rate is quoted in, as the API spells it. */
export type RateBasis = 'per_hour' | 'per_session' | 'per_day';

/** Session format as the API spells it: private (1:1) or group. */
export type TrainingFormat = 'INDIVIDUAL' | 'GROUP';

/** Class delivery mode; hybrid classes are priced from the in-person rates. */
export type DeliveryMode = 'IN_PERSON' | 'ONLINE' | 'HYBRID';

/** Cell-name prefix of a training method (format × location). */
export type MethodPrefix =
  | 'private_inperson'
  | 'group_inperson'
  | 'private_online'
  | 'group_online';

/** Cell-name fragment of a rate basis. */
export type BasisSuffix = 'hourly' | 'session' | 'daily';

/** One of the 12 rate card cells, e.g. `group_online_session_rate`. */
export type RateCellKey = `${MethodPrefix}_${BasisSuffix}_rate`;

/** A card being edited: cells may still hold raw input strings. */
export type RateCardInput = { currency?: string | null } & Partial<
  Record<RateCellKey, number | string | null | undefined>
>;

export type TrainingMethod = {
  prefix: MethodPrefix;
  label: string;
  format: TrainingFormat;
  location: 'in-person' | 'online';
};

export type RateBasisInfo = {
  value: RateBasis;
  label: string;
  unit: string;
  phrase: string;
  description: string;
  suffix: BasisSuffix;
};

export const DEFAULT_CURRENCY = 'KES';

/** The four ways to deliver training, in the order rate cards list them. */
export const TRAINING_METHODS: readonly TrainingMethod[] = [
  {
    prefix: 'private_inperson',
    label: 'Private in person',
    format: 'INDIVIDUAL',
    location: 'in-person',
  },
  { prefix: 'group_inperson', label: 'Group in person', format: 'GROUP', location: 'in-person' },
  { prefix: 'private_online', label: 'Private online', format: 'INDIVIDUAL', location: 'online' },
  { prefix: 'group_online', label: 'Group online', format: 'GROUP', location: 'online' },
];

/** The three units a rate can be charged in, in column order. */
export const RATE_BASES: readonly RateBasisInfo[] = [
  {
    value: 'per_hour',
    label: 'Per hour',
    unit: 'hour',
    phrase: 'per hour',
    description: 'Charged for every hour of every session.',
    suffix: 'hourly',
  },
  {
    value: 'per_session',
    label: 'Per session',
    unit: 'session',
    phrase: 'per session',
    description: 'One flat price per session, whatever its length.',
    suffix: 'session',
  },
  {
    value: 'per_day',
    label: 'Per day',
    unit: 'day',
    phrase: 'per day',
    description: 'One flat price per class day.',
    suffix: 'daily',
  },
];

type MethodRef = TrainingMethod | MethodPrefix;
type BasisRef = RateBasisInfo | RateBasis;

function prefixOf(method: MethodRef): MethodPrefix {
  return typeof method === 'string' ? method : method.prefix;
}

/** The RATE_BASES entry for a basis; unknown or missing values fall back to per hour. */
export function getRateBasis(basis?: BasisRef | string | null): RateBasisInfo {
  const value = typeof basis === 'object' && basis ? basis.value : basis;
  return RATE_BASES.find(entry => entry.value === value) ?? RATE_BASES[0]!;
}

/** The TRAINING_METHODS entry for a cell prefix. */
export function getTrainingMethod(prefix: MethodPrefix): TrainingMethod {
  return TRAINING_METHODS.find(method => method.prefix === prefix)!;
}

/** The cell holding a method's rate in a basis. */
export function cellKey(method: MethodRef, basis: BasisRef): RateCellKey {
  return `${prefixOf(method)}_${getRateBasis(basis).suffix}_rate`;
}

/** Every cell key, methods × bases in grid order. */
export const RATE_CELL_KEYS: readonly RateCellKey[] = TRAINING_METHODS.flatMap(method =>
  RATE_BASES.map(basis => cellKey(method, basis))
);

/** A cell value as a number, or null when blank, zero or not a number. */
export function parseRate(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed !== 0 ? parsed : null;
}

/** True when any of the method's three cells is set. */
export function isMethodOffered(
  card: RateCardInput | null | undefined,
  method: MethodRef
): boolean {
  if (!card) return false;
  return RATE_BASES.some(basis => parseRate(card[cellKey(method, basis)]) !== null);
}

/** The methods the card offers, in TRAINING_METHODS order. */
export function offeredMethods(card: RateCardInput | null | undefined): TrainingMethod[] {
  return TRAINING_METHODS.filter(method => isMethodOffered(card, method));
}

/** Cells left blank on methods the card offers. */
export function missingCells(card: RateCardInput | null | undefined): RateCellKey[] {
  return offeredMethods(card).flatMap(method =>
    RATE_BASES.map(basis => cellKey(method, basis)).filter(key => parseRate(card?.[key]) === null)
  );
}

export type RateCardErrors = {
  cells: Partial<Record<RateCellKey, string>>;
  card: string[];
  valid: boolean;
};

/** Mirrors the backend: offered methods price every basis above zero and at least the minimum. */
export function validateRateCard(
  card: RateCardInput | null | undefined,
  minimum?: number | null
): RateCardErrors {
  const cells: RateCardErrors['cells'] = {};
  const cardErrors: string[] = [];
  const floor = typeof minimum === 'number' && minimum > 0 ? minimum : null;
  const currency = card?.currency || DEFAULT_CURRENCY;
  const offered = offeredMethods(card);

  if (offered.length === 0) cardErrors.push('Offer at least one training method.');

  for (const method of offered) {
    for (const basis of RATE_BASES) {
      const key = cellKey(method, basis);
      const value = parseRate(card?.[key]);
      if (value === null) cells[key] = `Enter a rate ${basis.phrase}.`;
      else if (value < 0) cells[key] = 'Must be above zero.';
      else if (floor !== null && value < floor)
        cells[key] = `At least ${formatRateAmount(floor, currency)}, the minimum training fee.`;
    }
  }

  return {
    cells,
    card: cardErrors,
    valid: cardErrors.length === 0 && Object.keys(cells).length === 0,
  };
}

/** A card ready to send: every cell present, blanks, zeros and NaN as null. */
export function normaliseRateCard(card: RateCardInput | null | undefined): RateCard {
  const out: RateCard = { currency: card?.currency || DEFAULT_CURRENCY };
  for (const key of RATE_CELL_KEYS) out[key] = parseRate(card?.[key]);
  return out;
}

/** Clears one method's three cells, i.e. stops offering it. */
export function clearMethod(card: RateCard, method: MethodRef): RateCard {
  const next: RateCard = { ...card };
  for (const basis of RATE_BASES) next[cellKey(method, basis)] = null;
  return next;
}

/** The single rate that applies; hybrid and in-person use in-person cells. Never 0. */
export function rateFor(
  card: RateCardInput | null | undefined,
  { format, delivery, basis }: { format: TrainingFormat; delivery: DeliveryMode; basis: RateBasis }
): number | null {
  if (!card) return null;
  const scope = format === 'INDIVIDUAL' ? 'private' : 'group';
  const location = delivery === 'ONLINE' ? 'online' : 'inperson';
  const value = parseRate(card[cellKey(`${scope}_${location}`, basis)]);
  return value !== null && value > 0 ? value : null;
}

const amountFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

/** "KES 3,800"; an em dash when there is no amount. */
export function formatRateAmount(amount: number | null | undefined, currency?: string | null) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '—';
  return `${currency || DEFAULT_CURRENCY} ${amountFormatter.format(amount)}`;
}

/** "KES 3,800 / hour"; an em dash when there is no amount. */
export function formatRate(
  amount: number | null | undefined,
  basis: RateBasis | string | null | undefined,
  currency: string | null | undefined = DEFAULT_CURRENCY
) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '—';
  return `${formatRateAmount(amount, currency)} / ${getRateBasis(basis).unit}`;
}

/** "per hour" / "per session" / "per day". */
export function formatRateBasis(basis: RateBasis | string | null | undefined) {
  return getRateBasis(basis).phrase;
}

export type RateCellChange =
  | { key: RateCellKey; kind: 'added'; to: number }
  | { key: RateCellKey; kind: 'removed'; from: number }
  | { key: RateCellKey; kind: 'changed'; from: number; to: number; delta: number };

/** Cells that differ between the live card and a proposed one, in grid order. */
export function rateCardChanges(
  current: RateCardInput | null | undefined,
  proposed: RateCardInput | null | undefined
): RateCellChange[] {
  const changes: RateCellChange[] = [];
  for (const key of RATE_CELL_KEYS) {
    const from = parseRate(current?.[key]);
    const to = parseRate(proposed?.[key]);
    if (from === to) continue;
    if (from === null && to !== null) changes.push({ key, kind: 'added', to });
    else if (from !== null && to === null) changes.push({ key, kind: 'removed', from });
    else if (from !== null && to !== null)
      changes.push({ key, kind: 'changed', from, to, delta: to - from });
  }
  return changes;
}
