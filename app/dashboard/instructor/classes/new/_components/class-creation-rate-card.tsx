'use client';

import { Info } from 'lucide-react';

import { Card } from '@/components/ui/card';

export type ClassCreationRateSummary = {
  currency?: string;
  label?: string;
  ratePerHour?: number;
};

export function ClassCreationRateCard({
  totalHours,
  pricePerHour,
  totalSessions,
  totalAmount,
  summary,
  onEditRate,
}: {
  totalHours: number;
  pricePerHour: number;
  totalAmount: number;
  totalSessions: number;
  onEditRate: () => void;
  summary?: ClassCreationRateSummary | null;
}) {
  const currency = summary?.currency || 'KES';
  const resolvedRatePerHour = summary?.ratePerHour ?? pricePerHour ?? 0;

  return (
    <Card className='overflow-hidden border border-primary/20 p-0 shadow-sm'>
      <div className='border-b border-primary/10 px-4 py-1.5'>
        <div className='flex items-center gap-1.5 pt-2'>
          <h3 className='text-foreground text-sm font-semibold'>
            Instructor Rate Card
          </h3>
          <Info className='text-muted-foreground h-3.5 w-3.5' />
        </div>
      </div>

      <div className='space-y-2 px-4 py-2'>
        <div className='grid gap-2 sm:grid-cols-2'>
          <div className='space-y-0.5'>
            <p className='text-muted-foreground text-[11px] font-medium'>
              Fee per Hour
            </p>
            <p className='text-foreground text-base font-semibold'>
              {currency} {resolvedRatePerHour.toLocaleString()}
            </p>
          </div>

          <div className='space-y-0.5'>
            <p className='text-muted-foreground text-[11px] font-medium'>Total Hours</p>
            <p className='text-foreground text-base font-semibold'>
              {totalHours > 0 ? `${totalHours} ${totalHours === 1 ? 'Hour' : 'Hours'}` : '—'}
            </p>
          </div>

          <div className='space-y-0.5'>
            <p className='text-muted-foreground text-[11px] font-medium'>Total Sessions</p>
            <p className='text-foreground text-base font-semibold'>
              {totalSessions > 0 ? totalSessions.toLocaleString() : '—'}
            </p>
          </div>

          <div className='space-y-0.5'>
            <p className='text-muted-foreground text-[11px] font-medium'>Total Amount</p>
            <p className='text-foreground text-base font-semibold'>
              {currency} {totalAmount.toLocaleString()}
            </p>
          </div>
        </div>

        <button
          type='button'
          onClick={onEditRate}
          className='text-primary text-xs font-semibold transition hover:opacity-80'
        >
          Edit Rate
        </button>
      </div>
    </Card>
  );
}
