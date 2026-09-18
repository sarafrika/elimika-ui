'use client';

import type { DeliveryMode } from '@/lib/rate-card';
import { ChoiceCard } from './choice-card';

const DELIVERY_OPTIONS: readonly {
  value: DeliveryMode;
  label: string;
  description: string;
}[] = [
  { value: 'IN_PERSON', label: 'In person', description: 'Learners meet at a venue.' },
  {
    value: 'HYBRID',
    label: 'Hybrid',
    description: 'At a venue with an online link. Priced with in-person rates.',
  },
  {
    value: 'ONLINE',
    label: 'Online',
    description: 'A meeting link only. Priced with online rates.',
  },
];

export const deliveryModeLabel = (delivery?: DeliveryMode | null) =>
  DELIVERY_OPTIONS.find(option => option.value === delivery)?.label ?? '';

export function DeliveryCards({
  value,
  onChange,
  disabled = false,
}: {
  value: DeliveryMode | null;
  onChange: (delivery: DeliveryMode) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className='min-w-0 space-y-2'>
      <legend className='text-foreground mb-2 text-sm font-semibold'>How is it delivered?</legend>
      <div role='radiogroup' aria-label='Delivery' className='grid gap-3 sm:grid-cols-3'>
        {DELIVERY_OPTIONS.map(option => (
          <ChoiceCard
            key={option.value}
            title={option.label}
            description={option.description}
            selected={value === option.value}
            disabled={disabled}
            onSelect={() => onChange(option.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}
