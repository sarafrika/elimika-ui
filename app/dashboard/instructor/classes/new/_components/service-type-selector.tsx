'use client';

import { Check } from 'lucide-react';
import { useMemo } from 'react';
import {
  DEFAULT_RATE_BASIS,
  type RateBasis,
  rateBasisUnit,
} from '@/components/class-form/class-form-shared';

export type ServiceType = 'PRIVATE_ONLINE' | 'GROUP_ONLINE' | 'GROUP_INPERSON' | 'PRIVATE_INPERSON';

export interface ServiceTypeOption {
  label: string;
  value: ServiceType;
  description: string;
  classType: 'PRIVATE' | 'GROUP';
  locationType: 'ONLINE' | 'IN_PERSON' | 'HYBRID';
  /** Rate-card column prefix; the basis decides the suffix. */
  key: string;
  price?: number;
}

interface ServiceTypeSelectorProps {
  value: ServiceType | undefined;
  onChange: (
    value: ServiceType,
    classType: 'PRIVATE' | 'GROUP',
    locationType: 'ONLINE' | 'IN_PERSON' | 'HYBRID'
  ) => void;
  rateCard?: Record<string, number | string | null | undefined>;
  /** The contracted basis, so the card shows the rate the class will actually bill at. */
  rateBasis?: RateBasis;
}

const rateSuffix = (basis: RateBasis) =>
  basis === 'per_session' ? 'session_rate' : basis === 'per_day' ? 'daily_rate' : 'hourly_rate';

export function ServiceTypeSelector({
  value,
  onChange,
  rateCard,
  rateBasis = DEFAULT_RATE_BASIS,
}: ServiceTypeSelectorProps) {
  const unit = rateBasisUnit(rateBasis);

  const serviceOptions = useMemo<ServiceTypeOption[]>(() => {
    const base: Omit<ServiceTypeOption, 'price'>[] = [
      {
        label: 'One-on-One Session',
        value: 'PRIVATE_ONLINE',
        description: '1 student, online',
        classType: 'PRIVATE',
        locationType: 'ONLINE',
        key: 'private_online',
      },
      {
        label: 'Group Session (2–5)',
        value: 'GROUP_ONLINE',
        description: 'Small group learning, online',
        classType: 'GROUP',
        locationType: 'ONLINE',
        key: 'group_online',
      },
      {
        label: 'Online Course',
        value: 'GROUP_INPERSON',
        description: 'Structured course delivery, in-person',
        classType: 'GROUP',
        locationType: 'IN_PERSON',
        key: 'group_inperson',
      },
      {
        label: 'Private In-Person Class',
        value: 'PRIVATE_INPERSON',
        description: '1-on-1 physical session',
        classType: 'PRIVATE',
        locationType: 'IN_PERSON',
        key: 'private_inperson',
      },
      // {
      //   label: 'Private Hybrid Session',
      //   value: 'PRIVATE_HYBRID',
      //   description: '1 student, online + in-person',
      //   classType: 'PRIVATE',
      //   locationType: 'HYBRID',
      //   key: 'private_hybrid_rate',
      // },
      // {
      //   label: 'Group Hybrid Session',
      //   value: 'GROUP_HYBRID',
      //   description: 'Small group, online + in-person',
      //   classType: 'GROUP',
      //   locationType: 'HYBRID',
      //   key: 'group_hybrid_rate',
      // },
    ];

    return base.map(opt => {
      const column = `${opt.key}_${rateSuffix(rateBasis)}`;
      return {
        ...opt,
        price: rateCard && column in rateCard ? Number(rateCard[column] ?? 0) : 0,
      };
    });
  }, [rateCard, rateBasis]);

  return (
    <div className='space-y-3'>
      <div className='space-y-1'>
        <label className='text-foreground text-sm font-semibold'>Service Type *</label>
        <p className='text-muted-foreground text-xs'>
          Select the type of session you want to create. This determines pricing and format. Rates
          shown are the ones approved for you, for a per-{unit} contract.
        </p>
      </div>

      <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
        {serviceOptions.map(option => (
          <button
            key={option.value}
            type='button'
            onClick={() => onChange(option.value, option.classType, option.locationType)}
            className={`relative flex flex-col gap-2 rounded-lg border p-4 text-left transition-all ${
              value === option.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-accent/50'
            }`}
          >
            {value === option.value && (
              <div className='bg-primary absolute top-3 right-3 rounded-full p-1'>
                <Check className='text-primary-foreground h-4 w-4' />
              </div>
            )}
            <div>
              <p className='text-foreground text-sm font-semibold'>{option.label}</p>
              <p className='text-muted-foreground text-xs'>{option.description}</p>
            </div>
            {(option?.price ?? 0) > 0 ? (
              <div className='text-primary text-xs font-medium'>
                KES {option?.price?.toLocaleString()}/{unit}
              </div>
            ) : (
              <div className='text-muted-foreground text-xs'>No approved per-{unit} rate</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
