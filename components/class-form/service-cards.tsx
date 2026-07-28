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
    <div className="space-y-3">
      <Label className="text-sm font-medium">Select Service</Label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map(s => {
          const selected = value === s.key;
          const rate = approvedRateFor(rateCard, s.format, delivery);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onChange(s.key)}
              className={cn(
                'rounded-lg border p-3 text-left transition-all',
                selected ? 'border-primary bg-primary/5 ring-2 ring-primary/25' : 'border-border hover:border-primary/40'
              )}
            >
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                    selected ? 'border-primary' : 'border-muted-foreground/40'
                  )}
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-tight">{s.title}</div>
                  {s.subtitle && <div className="text-xs text-muted-foreground">{s.subtitle}</div>}
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {formatMoney(rate, rateCard?.currency)}
                </span>{' '}
                / {s.unit}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {rateCard
          ? 'Rates are the ones the course creator approved for your organisation, for your selected delivery mode.'
          : 'Select an approved course or program to see the rates its creator approved.'}
      </p>
    </div>
  );
}
