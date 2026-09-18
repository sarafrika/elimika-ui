'use client';

import {
  type DeliveryMode,
  formatRate,
  type RateBasis,
  type RateCard,
  rateFor,
} from '@/lib/rate-card';
import { ChoiceCard } from './choice-card';
import { type RateViewer, type ServiceKey, servicesFor } from './class-form-shared';

/** The delivery's two services, each priced from the one rate card cell it bills at. */
export function ServiceCards({
  value,
  onChange,
  rateCard,
  delivery,
  basis,
  viewer = 'owner',
}: {
  value: ServiceKey | null;
  onChange: (service: ServiceKey) => void;
  rateCard?: RateCard | null;
  delivery: DeliveryMode;
  basis: RateBasis | null;
  viewer?: RateViewer;
}) {
  const online = delivery === 'ONLINE';
  const owner = viewer === 'owner';

  return (
    <fieldset className='min-w-0 space-y-2'>
      <legend className='text-foreground text-sm font-semibold'>Which service?</legend>
      <p className='text-muted-foreground text-xs'>
        {`${online ? 'Online' : 'In-person'} services, priced with ${owner ? 'your' : 'the instructor’s'} ${online ? 'online' : 'in-person'} rates.`}
      </p>
      {basis ? (
        <div role='radiogroup' aria-label='Service' className='grid gap-3 pt-1 sm:grid-cols-2'>
          {servicesFor(delivery).map(service => {
            const rate = rateFor(rateCard, { format: service.format, delivery, basis });
            return (
              <ChoiceCard
                key={service.key}
                title={service.title}
                aside={<span className='text-muted-foreground text-xs'>{service.subtitle}</span>}
                selected={value === service.key}
                disabled={rate === null}
                onSelect={() => onChange(service.key)}
              >
                <p className='text-muted-foreground pl-6 text-xs'>
                  {rate === null ? (
                    owner ? (
                      'Not on your rate card'
                    ) : (
                      'Not offered'
                    )
                  ) : (
                    <>
                      <span className='text-foreground text-base font-semibold'>
                        {formatRate(rate, basis, rateCard?.currency)}
                      </span>{' '}
                      {owner ? 'per learner · your approved rate' : 'per learner'}
                    </>
                  )}
                </p>
              </ChoiceCard>
            );
          })}
        </div>
      ) : (
        <div className='border-border bg-muted/30 text-muted-foreground rounded-md border border-dashed px-4 py-5 text-center text-sm'>
          {owner
            ? 'Pick a billing basis on your rate card to see your services.'
            : 'Pick how you are billed to see the services on offer.'}
        </div>
      )}
    </fieldset>
  );
}
