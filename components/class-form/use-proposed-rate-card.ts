'use client';

import { useRateUpdates } from '@/src/features/rate-card/hooks';
import type { Offering } from './offering-picker';

/** The course or program an offering value (`course:<uuid>`) points at. */
export function offeringTarget(offering?: Pick<Offering, 'value'> | null) {
  const [kind, parentUuid = ''] = (offering?.value ?? '').split(':');
  return { kind: kind === 'program' ? ('program' as const) : ('course' as const), parentUuid };
}

/** The applicant's proposed card while a rate update on the offering's application awaits approval. */
export function useProposedRateCard(offering?: Offering) {
  const { kind, parentUuid } = offeringTarget(offering);
  const { pending } = useRateUpdates(
    kind,
    parentUuid,
    offering?.pendingRateUpdateUuid ? offering.applicationUuid : null
  );
  return pending?.proposed_rate_card ?? null;
}
