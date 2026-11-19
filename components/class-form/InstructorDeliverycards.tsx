'use client';

import { EmptyState } from '@/components/ui/empty-state';
import {
  formatRate,
  type DeliveryMode,
  type RateCardInput,
  type SelectableRateBasis,
} from '@/lib/rate-card';
import { useMemo } from 'react';
import { ChoiceCard } from './choice-card';
import { getService, type ServiceKey } from './class-form-shared';
import { instructorDeliveryRates, type InstructorDeliveryRate } from './instructor-delivery-rates';

const SERVICE_ORDER: ServiceKey[] = ['1on1', 'group', 'online', 'private-online'];

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
  const services = useMemo(
    () =>
      SERVICE_ORDER.map(key => ({
        service: getService(key)!,
        // Match organisation class creation: hourly first, otherwise daily.
        rate: rates.find(rate => rate.service === key && rate.delivery !== 'HYBRID'),
      })),
    [rates]
  );

  return (
    <fieldset className='min-w-0 space-y-2' disabled={disabled}>
      <legend className='text-foreground text-sm font-semibold'>Which service?</legend>
      <p className='text-muted-foreground text-xs'>
        Choose a service for this course or program. Your approved hourly rate is used when
        available, otherwise your approved daily rate.
      </p>
      {rates.length ? (
        <div
          role='radiogroup'
          aria-label='Approved instructor services'
          className='grid gap-3 pt-1 sm:grid-cols-2 xl:grid-cols-4'
        >
          {services.map(({ service, rate }) => (
            <ChoiceCard
              key={service.key}
              title={service.title}
              aside={<span className='text-muted-foreground text-xs'>{service.subtitle}</span>}
              description={
                rate
                  ? `${formatRate(rate.amount, rate.basis, rateCard?.currency)} · your approved rate`
                  : 'No approved rate'
              }
              selected={Boolean(
                rate &&
                value.delivery === rate.delivery &&
                value.service === rate.service &&
                value.basis === rate.basis
              )}
              disabled={disabled || !rate}
              onSelect={() => {
                if (rate) onChange(rate);
              }}
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
