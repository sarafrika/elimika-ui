import { type RateCard, rateFor } from '@/lib/rate-card';

type ServiceRateSelection = Parameters<typeof rateFor>[1];

/** Directory reads may withhold a rate card; that does not mean its rates are missing. */
export function instructorServiceRate(
  card: RateCard | null | undefined,
  selection: ServiceRateSelection
): { status: 'unavailable' | 'missing' | 'approved'; rate: number | null } {
  if (card == null) return { status: 'unavailable', rate: null };
  const rate = rateFor(card, selection);
  return { status: rate === null ? 'missing' : 'approved', rate };
}
