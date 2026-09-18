'use client';

import { type Dispatch, useMemo } from 'react';

import { RateCardGrid } from '@/components/rate-card/rate-card-grid';
import { DEFAULT_CURRENCY, validateRateCard } from '@/lib/rate-card';

import type { ApplyAction, ApplyState } from './apply-model';

/** Methods are offered by switching their row on; every offered row prices all three bases. */
export function StepPricing({
  state,
  dispatch,
  minimumFee,
}: {
  state: ApplyState;
  dispatch: Dispatch<ApplyAction>;
  minimumFee?: number | null;
}) {
  const validation = useMemo(
    () => validateRateCard(state.card, minimumFee),
    [state.card, minimumFee]
  );

  return (
    <div className='space-y-4'>
      <p className='text-muted-foreground text-sm'>
        Switch on each training method you will offer and price it per hour, per session and per
        day, so any job posted later already has an approved rate. Rates are{' '}
        {state.card.currency || DEFAULT_CURRENCY} per learner.
      </p>

      <RateCardGrid
        mode='edit'
        value={state.card}
        onChange={card => dispatch({ type: 'card', card })}
        errors={validation.cells}
        minimum={minimumFee}
      />
    </div>
  );
}
