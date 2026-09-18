'use client';

import { CircleCheck, Clock } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { RATE_BASES, type RateBasis, type RateBasisInfo } from '@/lib/rate-card';
import { ChoiceCard } from './choice-card';
import type { BasisStatus, RateViewer } from './class-form-shared';

/** Only bases the rate card prices can be picked; the rest say why and how to add them. */
export function BillingBasisCards({
  value,
  onChange,
  statusFor,
  renderAddAction,
  hint,
  viewer = 'owner',
}: {
  value: RateBasis | null;
  onChange: (basis: RateBasis) => void;
  statusFor: (basis: RateBasis) => BasisStatus;
  renderAddAction?: (basis: RateBasisInfo) => ReactNode;
  hint?: ReactNode;
  viewer?: RateViewer;
}) {
  return (
    <fieldset className='min-w-0 space-y-2'>
      <legend className='text-foreground text-sm font-semibold'>
        {viewer === 'owner' ? 'How are learners billed?' : 'How would you like to be billed?'}
      </legend>
      {hint ? <p className='text-muted-foreground text-xs'>{hint}</p> : null}
      <div role='radiogroup' aria-label='Billing basis' className='grid gap-3 pt-1 md:grid-cols-3'>
        {RATE_BASES.map(basis => {
          const status = statusFor(basis.value);
          return (
            <ChoiceCard
              key={basis.value}
              title={basis.label}
              description={basis.description}
              selected={value === basis.value}
              disabled={status !== 'approved'}
              onSelect={() => onChange(basis.value)}
            >
              <div className='flex flex-wrap items-center gap-2 pl-6'>
                {status === 'approved' ? (
                  <Badge variant='outline' className='border-success/40 bg-success/10 text-success'>
                    <CircleCheck aria-hidden />
                    {viewer === 'owner' ? 'Rates approved' : 'Offered'}
                  </Badge>
                ) : status === 'pending' ? (
                  <Badge
                    variant='outline'
                    className='border-warning/50 bg-warning/10 text-foreground'
                  >
                    <Clock aria-hidden />
                    Added · awaiting approval
                  </Badge>
                ) : (
                  <>
                    <Badge variant='outline' className='bg-muted/60 text-muted-foreground'>
                      {viewer === 'owner' ? 'Not on your rate card' : 'Not offered'}
                    </Badge>
                    {renderAddAction?.(basis)}
                  </>
                )}
              </div>
            </ChoiceCard>
          );
        })}
      </div>
    </fieldset>
  );
}
