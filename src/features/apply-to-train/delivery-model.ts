import {
  cellKey,
  clearMethod,
  DEFAULT_CURRENCY,
  formatRateAmount,
  type MethodPrefix,
  normaliseRateCard,
  offeredMethods,
  parseRate,
  RATE_BASES,
  type RateCard,
  type RateCellKey,
  TRAINING_METHODS,
} from '@/lib/rate-card';

/** Switched-on methods are tracked apart from the card: an empty row is still "on". */
export type DeliveryDraft = { methods: MethodPrefix[]; card: RateCard };

export function deliveryFromCard(card?: RateCard | null): DeliveryDraft {
  const normalised = normaliseRateCard(card);
  return {
    methods: offeredMethods(normalised).map(method => method.prefix),
    card: normalised,
  };
}

export type DeliveryValidation = {
  cells: Partial<Record<RateCellKey, string>>;
  general: string[];
  count: number;
};

/** Every switched-on method needs both rates, each at least the minimum training fee. */
export function validateDelivery(draft: DeliveryDraft, minimum: number | null): DeliveryValidation {
  const cells: DeliveryValidation['cells'] = {};
  const general: string[] = [];
  const floor = minimum !== null && minimum > 0 ? minimum : null;
  if (draft.methods.length === 0) general.push('Switch on at least one way to deliver this.');
  for (const prefix of draft.methods) {
    for (const basis of RATE_BASES) {
      const key = cellKey(prefix, basis);
      const value = parseRate(draft.card[key]);
      if (value === null || value <= 0) cells[key] = `Enter a rate ${basis.phrase}.`;
      else if (floor !== null && value < floor)
        cells[key] = `At least ${formatRateAmount(floor, draft.card.currency)}, the minimum training fee.`;
    }
  }
  return { cells, general, count: general.length + Object.keys(cells).length };
}

/** The card to send: switched-off methods cleared, KES by default. */
export function deliveryRateCard(draft: DeliveryDraft): RateCard {
  let card = normaliseRateCard({ ...draft.card, currency: draft.card.currency || DEFAULT_CURRENCY });
  for (const method of TRAINING_METHODS)
    if (!draft.methods.includes(method.prefix)) card = clearMethod(card, method);
  return card;
}

export const hourlyRate = (draft: DeliveryDraft, prefix: MethodPrefix) =>
  parseRate(draft.card[cellKey(prefix, 'per_hour')]);
