'use client';

import { EnrollmentLoadingState } from '@/src/features/dashboard/courses/components/EnrollmentLoadingState';
import { format } from 'date-fns';
import { CalendarDays, CalendarRange, Filter, Layers3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BundledClass } from '../types';
import EnrollCourseCard from './enroll-course-card';

type AvailabilityListingLayoutProps = {
  appliedEnd: string;
  appliedStart: string;
  dateError: string | null;
  emptyDescription: string;
  emptyTitle: string;
  endDateInput: string;
  heading: string;
  helperText: string;
  isLoading: boolean;
  items: BundledClass[];
  onApplyDates: () => void;
  onClearDates: () => void;
  onEnroll: (cls: BundledClass) => void;
  setEndDateInput: (value: string) => void;
  setStartDateInput: (value: string) => void;
  startDateInput: string;
  subheading: string;
};

export function AvailabilityListingLayout({
  appliedEnd,
  appliedStart,
  dateError,
  emptyDescription,
  emptyTitle,
  endDateInput,
  heading,
  helperText,
  isLoading,
  items,
  onApplyDates,
  onClearDates,
  onEnroll,
  setEndDateInput,
  setStartDateInput,
  startDateInput,
  subheading,
}: AvailabilityListingLayoutProps) {
  const activeRangeLabel =
    appliedStart && appliedEnd
      ? `${format(new Date(appliedStart), 'MMM dd, yyyy')} - ${format(new Date(appliedEnd), 'MMM dd, yyyy')}`
      : 'Pick a date range to start';

  return (
    <div className='mx-auto w-full max-w-[1680px] space-y-6 pb-10'>
      <section className='border-border bg-card relative overflow-hidden rounded-[22px] border px-5 py-5 sm:px-6 sm:py-6'>
        <div className='from-primary/10 via-background absolute inset-0 bg-gradient-to-br to-transparent' />
        <div className='relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-3xl space-y-3'>
            <div className='bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold'>
              <Sparkles className='size-3.5' />
              {subheading}
            </div>
            <div className='space-y-2'>
              <h1 className='text-foreground text-[clamp(1.55rem,2.1vw,2.3rem)] font-semibold tracking-[-0.03em]'>
                {heading}
              </h1>
              <p className='text-muted-foreground max-w-2xl text-sm sm:text-[0.95rem]'>
                {helperText}
              </p>
            </div>
          </div>

          <div className='grid gap-3 sm:grid-cols-3 lg:min-w-[420px]'>
            <Card className='rounded-2xl border bg-background/80 p-4 shadow-none'>
              <div className='flex items-center gap-3'>
                <span className='bg-primary/10 text-primary inline-flex size-9 items-center justify-center rounded-xl'>
                  <Layers3 className='size-4' />
                </span>
                <div>
                  <p className='text-muted-foreground text-xs font-medium'>Visible items</p>
                  <p className='text-foreground text-lg font-semibold'>{items.length}</p>
                </div>
              </div>
            </Card>
            <Card className='rounded-2xl border bg-background/80 p-4 shadow-none'>
              <div className='flex items-center gap-3'>
                <span className='bg-success/10 text-success inline-flex size-9 items-center justify-center rounded-xl'>
                  <CalendarDays className='size-4' />
                </span>
                <div>
                  <p className='text-muted-foreground text-xs font-medium'>Start window</p>
                  <p className='text-foreground text-sm font-semibold'>
                    {format(new Date(appliedStart), 'MMM dd')}
                  </p>
                </div>
              </div>
            </Card>
            <Card className='rounded-2xl border bg-background/80 p-4 shadow-none'>
              <div className='flex items-center gap-3'>
                <span className='bg-warning/15 text-warning inline-flex size-9 items-center justify-center rounded-xl'>
                  <CalendarRange className='size-4' />
                </span>
                <div>
                  <p className='text-muted-foreground text-xs font-medium'>Active range</p>
                  <p className='text-foreground line-clamp-1 text-sm font-semibold'>
                    {activeRangeLabel}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Card className='rounded-[20px] border bg-card p-4 shadow-none sm:p-5'>
        <div className='flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between'>
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <span className='bg-primary/10 text-primary inline-flex size-8 items-center justify-center rounded-lg'>
                <Filter className='size-4' />
              </span>
              <div>
                <p className='text-foreground text-sm font-semibold'>Filter by schedule</p>
                <p className='text-muted-foreground text-sm'>
                  Narrow the catalogue to the date window your learner can actually attend.
                </p>
              </div>
            </div>

            <div className='bg-muted/40 inline-flex min-h-11 flex-wrap items-center gap-2 rounded-2xl px-3 py-2 text-sm'>
              <span className='text-muted-foreground'>Selected range</span>
              <span className='text-foreground font-medium'>{activeRangeLabel}</span>
            </div>
          </div>

          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-[160px_160px_auto_auto]'>
            <div>
              <Label className='text-muted-foreground text-xs font-medium'>Start date</Label>
              <Input
                type='date'
                value={startDateInput}
                onChange={event => setStartDateInput(event.target.value)}
                className='mt-1.5 h-11 rounded-xl'
              />
            </div>

            <div>
              <Label className='text-muted-foreground text-xs font-medium'>End date</Label>
              <Input
                type='date'
                value={endDateInput}
                onChange={event => setEndDateInput(event.target.value)}
                className='mt-1.5 h-11 rounded-xl'
              />
            </div>

            <Button className='h-11 rounded-xl px-5' onClick={onApplyDates}>
              Apply Range
            </Button>

            <Button
              variant='outline'
              onClick={onClearDates}
              className='h-11 rounded-xl px-5 shadow-none'
            >
              Reset
            </Button>
          </div>
        </div>

        {dateError ? <p className='text-destructive text-sm'>{dateError}</p> : null}
      </Card>

      {isLoading ? (
        <EnrollmentLoadingState
          title='Finding available classes'
          description='We are checking the current schedule window and preparing the best class options for this learner.'
        />
      ) : !appliedStart || !appliedEnd ? (
        <Card className='rounded-[20px] border border-dashed p-8 text-center shadow-none'>
          <h3 className='text-foreground text-lg font-semibold'>Select a date range</h3>
          <p className='text-muted-foreground text-sm'>
            Choose a start and end date then click Apply to view available sessions.
          </p>
        </Card>
      ) : items.length === 0 ? (
        <Card className='rounded-[20px] border border-dashed p-8 text-center shadow-none'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='text-muted-foreground mx-auto h-10 w-10'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M8 7V3m8 4V3m-9 8h10m-9 4h4m-8 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
            />
          </svg>
          <h3 className='text-foreground mt-3 text-lg font-semibold'>{emptyTitle}</h3>
          <p className='text-muted-foreground text-sm'>{emptyDescription}</p>
        </Card>
      ) : (
        <section className='space-y-4'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <h2 className='text-foreground text-lg font-semibold'>Open sessions</h2>
              <p className='text-muted-foreground text-sm'>
                Compact cards with schedule-ready enrollment options.
              </p>
            </div>
            <div className='bg-muted/50 text-muted-foreground inline-flex items-center rounded-full px-3 py-1 text-xs font-medium'>
              {items.length} item{items.length === 1 ? '' : 's'} available
            </div>
          </div>

          <div className='grid gap-4 justify-items-center md:grid-cols-2 2xl:grid-cols-3'>
            {items.map(item => (
              <EnrollCourseCard
                key={item.uuid}
                href='#'
                cls={item}
                isFull={false}
                disableEnroll={false}
                handleEnroll={onEnroll}
                variant='full'
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
