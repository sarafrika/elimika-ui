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
    <article className='rounded-[12px] border border-border/60 bg-white px-3 py-3 shadow-[0_10px_24px_rgba(31,79,183,0.05)]'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h3 className='truncate text-[0.98rem] font-semibold text-foreground sm:text-[1rem]'>
            {booking.title}
          </h3>
          <p className='truncate text-[0.82rem] text-muted-foreground'>{booking.subtitle}</p>
        </div>

        <span
          className={cn(
            'inline-flex shrink-0 rounded-full px-3 py-1 text-[0.74rem] font-medium',
            booking.statusTone === 'info'
              ? 'bg-[color-mix(in_srgb,var(--primary)_10%,white)] text-primary'
              : 'bg-[color-mix(in_srgb,var(--warning)_18%,white)] text-[color-mix(in_srgb,var(--warning)_92%,black)]',
          )}
        >
          {booking.status}
        </span>
      </div>

      <div className='mt-3 flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2 text-[0.82rem] text-primary'>
            <Users className='size-4' />
            <span>{booking.meta}</span>
          </div>

          {typeof booking.progress === 'number' ? (
            <div className='mt-3 h-2.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--primary)_10%,white)]'>
              <div
                aria-hidden='true'
                className='h-full rounded-full bg-primary'
                style={{ width: `${booking.progress}%` }}
              />
            </div>
          ) : null}
        </div>

        <Link
          className={cn(
            'inline-flex h-10 items-center justify-center rounded-[8px] px-5 text-[0.82rem] font-medium transition focus-visible:outline-none focus-visible:ring-2',
            booking.actionTone === 'primary'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/30'
              : 'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30',
          )}
          href={booking.href}
        >
          {booking.actionLabel}
        </Link>
      </div>
    </article>
  );
}
