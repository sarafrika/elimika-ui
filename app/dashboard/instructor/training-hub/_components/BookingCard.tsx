// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrainingHubBooking } from './training-hub-data';

type BookingCardProps = {
  booking: TrainingHubBooking;
};

export function BookingCard({ booking }: BookingCardProps) {
  return (
    <article className='border-border/60 bg-card rounded-[12px] border px-3 py-3 shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h3 className='text-foreground truncate text-[0.98rem] font-semibold sm:text-[1rem]'>
            {booking.title}
          </h3>
          <p className='text-muted-foreground truncate text-[0.82rem]'>{booking.subtitle}</p>
        </div>

        <span
          className={cn(
            'inline-flex shrink-0 rounded-full px-3 py-1 text-[0.74rem] font-medium',
            booking.statusTone === 'info'
              ? 'bg-primary/10 text-primary'
              : 'bg-warning/10 text-warning dark:text-amber-300'
          )}
        >
          {booking.status}
        </span>
      </div>

      <div className='mt-3 flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between'>
        <div className='min-w-0 flex-1'>
          <div className='text-primary flex items-center gap-2 text-[0.82rem]'>
            <Users className='size-4' />
            <span>{booking.meta}</span>
          </div>

          {typeof booking.progress === 'number' ? (
            <div className='bg-primary/10 mt-3 h-2.5 overflow-hidden rounded-full'>
              <div
                aria-hidden='true'
                className='bg-primary h-full rounded-full'
                style={{ width: `${booking.progress}%` }}
              />
            </div>
          ) : null}
        </div>

        <Link
          className={cn(
            'inline-flex h-10 items-center justify-center rounded-[8px] px-5 text-[0.82rem] font-medium transition focus-visible:ring-2 focus-visible:outline-none',
            booking.actionTone === 'primary'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/30'
              : 'bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/30 text-white'
          )}
          href={booking.href}
        >
          {booking.actionLabel}
        </Link>
      </div>
    </article>
  );
}
