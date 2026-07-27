'use client';

import { Card } from '@/components/ui/card';
import { Banknote, CalendarDays, Users } from 'lucide-react';

export function ClassCreationSummaryStrip({
  totalSessions,
  maxParticipants,
  totalAmount,
  currency = 'KES',
}: {
  currency?: string;
  maxParticipants: number;
  totalAmount: number;
  totalSessions: number;
}) {
  const items = [
    {
      icon: CalendarDays,
      label: 'Total Sessions Created',
      value: String(totalSessions),
    },
    {
      icon: Users,
      label: 'Max Students Capacity Per Session',
      value: String(maxParticipants || 0),
    },
    {
      icon: Banknote,
      label: 'Total Amount For All Sessions (per student)',
      value: `${currency} ${totalAmount.toLocaleString()}`,
    },
  ];

  return (
    <Card className='overflow-hidden border pt-2 pb-0 shadow-sm rounded-md'>
      <div className='grid gap-px bg-border md:grid-cols-3'>
        {items.map(item => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className='bg-card flex items-start gap-2.5 px-3 py-3'
            >
              <div className='bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-md'>
                <Icon className='h-4 w-4' />
              </div>

              <div className='min-w-0'>
                <p className='text-foreground text-lg font-semibold leading-none sm:text-xl'>
                  {item.value}
                </p>

                <p className='text-muted-foreground mt-0.5 text-xs sm:text-sm'>
                  {item.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}