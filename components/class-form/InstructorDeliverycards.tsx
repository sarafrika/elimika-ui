'use client';

import { useMemo } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import {
  type DeliveryMode,
  formatRate,
  type RateCardInput,
  type SelectableRateBasis,
} from '@/lib/rate-card';
import { ChoiceCard } from './choice-card';
import type { ServiceKey } from './class-form-shared';
import { instructorDeliveryRates, type InstructorDeliveryRate } from './instructor-delivery-rates';

export function InstructorDeliverycards({
  rateCard,
  value,
  onChange,
  disabled = false,
}: {
  rateCard?: RateCardInput | null;
  value: {
    delivery: DeliveryMode | null;
    service: ServiceKey | null;
    basis: SelectableRateBasis | null;
  };
  onChange: (rate: InstructorDeliveryRate) => void;
  disabled?: boolean;
}) {
  const rates = useMemo(() => instructorDeliveryRates(rateCard), [rateCard]);

  return (
    <fieldset className='min-w-0 space-y-2' disabled={disabled}>
      <legend className='text-foreground text-sm font-semibold'>Which service?</legend>
      <p className='text-muted-foreground text-xs'>
        Choose an approved rate for this course or program. Hybrid services use your in-person
        rates.
      </p>
      {rates.length ? (
        <div
          role='radiogroup'
          aria-label='Approved instructor services'
          className='grid gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-3'
        >
          {rates.map(rate => (
            <ChoiceCard
              key={`${rate.delivery}:${rate.service}:${rate.basis}`}
              title={rate.title}
              description={`${formatRate(rate.amount, rate.basis, rateCard?.currency)} · your approved rate`}
              selected={
                value.delivery === rate.delivery &&
                value.service === rate.service &&
                value.basis === rate.basis
              }
              disabled={disabled}
              onSelect={() => onChange(rate)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          variant='compact'
          title='No approved delivery rates'
          description='Choose an offering with approved training rates to create a class.'
        />
      )}
    </fieldset>
  );
}
