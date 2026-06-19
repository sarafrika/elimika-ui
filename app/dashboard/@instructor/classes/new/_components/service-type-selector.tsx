'use client';

import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useMemo } from 'react';

export type ServiceType = 
  | 'PRIVATE_ONLINE' 
  | 'GROUP_ONLINE' 
  | 'GROUP_INPERSON' 
  | 'PRIVATE_INPERSON' 
  | 'PRIVATE_HYBRID'
  | 'GROUP_HYBRID';

export interface ServiceTypeOption {
  label: string;
  value: ServiceType;
  description: string;
  classType: 'PRIVATE' | 'GROUP';
  locationType: 'ONLINE' | 'IN_PERSON' | 'HYBRID';
  key: string;
  price?: number;
}

interface ServiceTypeSelectorProps {
  value: ServiceType | undefined;
  onChange: (value: ServiceType, classType: 'PRIVATE' | 'GROUP', locationType: 'ONLINE' | 'IN_PERSON' | 'HYBRID') => void;
  rateCard?: Record<string, number | string | null | undefined>;
}

export function ServiceTypeSelector({ value, onChange, rateCard }: ServiceTypeSelectorProps) {
  const serviceOptions = useMemo<ServiceTypeOption[]>(() => {
    const base: Omit<ServiceTypeOption, 'price'>[] = [
      {
        label: 'One-on-One Session',
        value: 'PRIVATE_ONLINE',
        description: '1 student, online',
        classType: 'PRIVATE',
        locationType: 'ONLINE',
        key: 'private_online_rate',
      },
      {
        label: 'Group Session (2–5)',
        value: 'GROUP_ONLINE',
        description: 'Small group learning, online',
        classType: 'GROUP',
        locationType: 'ONLINE',
        key: 'group_online_rate',
      },
      {
        label: 'Online Course',
        value: 'GROUP_INPERSON',
        description: 'Structured course delivery, in-person',
        classType: 'GROUP',
        locationType: 'IN_PERSON',
        key: 'group_inperson_rate',
      },
      {
        label: 'Private In-Person Class',
        value: 'PRIVATE_INPERSON',
        description: '1-on-1 physical session',
        classType: 'PRIVATE',
        locationType: 'IN_PERSON',
        key: 'private_inperson_rate',
      },
      {
        label: 'Private Hybrid Session',
        value: 'PRIVATE_HYBRID',
        description: '1 student, online + in-person',
        classType: 'PRIVATE',
        locationType: 'HYBRID',
        key: 'private_hybrid_rate',
      },
      {
        label: 'Group Hybrid Session',
        value: 'GROUP_HYBRID',
        description: 'Small group, online + in-person',
        classType: 'GROUP',
        locationType: 'HYBRID',
        key: 'group_hybrid_rate',
      },
    ];

    return base.map(opt => ({
      ...opt,
      price: rateCard && opt.key in rateCard ? Number(rateCard[opt.key] ?? 0) : 0,
    }));
  }, [rateCard]);

  return (
    <div className='space-y-3'>
      <div className='space-y-1'>
        <label className='text-foreground text-sm font-semibold'>Service Type *</label>
        <p className='text-muted-foreground text-xs'>
          Select the type of session you want to create. This determines pricing and format.
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
              <div className='absolute right-3 top-3 rounded-full bg-primary p-1'>
                <Check className='h-4 w-4 text-primary-foreground' />
              </div>
            )}
            <div>
              <p className='text-sm font-semibold text-foreground'>{option.label}</p>
              <p className='text-xs text-muted-foreground'>{option.description}</p>
            </div>
            {option.price > 0 && (
              <div className='text-xs font-medium text-primary'>
                KES {option.price.toLocaleString()}/hour
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
