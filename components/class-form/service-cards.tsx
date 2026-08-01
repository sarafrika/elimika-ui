'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  type ApprovedRateCard,
  approvedRateFor,
  formatMoney,
  SERVICES,
  type ServiceKey,
} from './class-form-shared';

export function ServiceCards({
  value,
  onChange,
  rateCard,
  delivery,
}: {
  value: ServiceKey;
  onChange: (v: ServiceKey) => void;
  rateCard?: ApprovedRateCard;
  delivery: 'IN_PERSON' | 'ONLINE' | 'HYBRID';
}) {
  return (
    <div className='space-y-3'>
      <Label className='text-sm font-medium'>Select Service</Label>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {SERVICES.map(s => {
          const selected = value === s.key;
          const rate = approvedRateFor(rateCard, s.format, delivery);
          return (
            <button
              key={s.key}
              type='button'
              onClick={() => onChange(s.key)}
              className={cn(
                'rounded-lg border p-3 text-left transition-all',
                selected
                  ? 'border-primary bg-primary/5 ring-primary/25 ring-2'
                  : 'border-border hover:border-primary/40'
              )}
            >
              <div className='flex items-start gap-2'>
                <span
                  className={cn(
                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                    selected ? 'border-primary' : 'border-muted-foreground/40'
                  )}
                >
                  {selected && <span className='bg-primary h-2 w-2 rounded-full' />}
                </span>
                <div className='min-w-0'>
                  <div className='text-sm leading-tight font-medium'>{s.title}</div>
                  {s.subtitle && <div className='text-muted-foreground text-xs'>{s.subtitle}</div>}
                </div>
              </div>
              <div className='text-muted-foreground mt-3 text-xs'>
                <span className='text-foreground font-medium'>
                  {formatMoney(rate, rateCard?.currency)}
                </span>{' '}
                / {s.unit}
              </div>
            </button>
          );
        })}
      </div>
      <p className='text-muted-foreground text-[11px]'>
        {rateCard
          ? 'Rates are the ones the course creator approved for your organisation, for your selected delivery mode.'
          : 'Select an approved course or program to see the rates its creator approved.'}
      </p>
    </div>
  );
}
