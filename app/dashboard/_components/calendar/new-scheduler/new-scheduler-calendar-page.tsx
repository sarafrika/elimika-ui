'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Info,
  Plus,
  Search,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { categoryDotStyles, schedulerEvents, schedulerMetrics } from './data';
import { SchedulerFilters } from './scheduler-filters';
import { SchedulerGrid } from './scheduler-grid';
import { SchedulerRightRail } from './scheduler-right-rail';
import { SchedulerStatCard } from './scheduler-stat-card';
import type { SchedulerProfile } from './types';

type Props = {
  profile: SchedulerProfile;
};

export function NewSchedulerCalendarPage({ profile }: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const createLabel = profile === 'student' ? 'View Session' : 'Create Session';

  return (
    <main className='bg-background space-y-4 pb-8'>
      {/* Top bar */}
      <div className='w-full'>
        <h1 className='text-foreground text-2xl font-semibold sm:text-3xl'>Calendar / Scheduler</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Manage Classes, Venues &amp; Instructors
        </p>
      </div>

      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <label className='relative min-w-0 flex-1 lg:max-w-4xl'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <input
            className='bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring h-11 w-full rounded-md border px-10 text-sm shadow-sm transition outline-none focus-visible:ring-2'
            placeholder='Search students, courses, instructors, venues...'
          />
        </label>

        <div className='flex flex-wrap items-center gap-2'>
          <Button className='h-10 rounded-md px-4 text-xs sm:text-sm'>
            <Plus className='h-4 w-4' />
            {createLabel}
          </Button>
        </div>
      </div>

      {/* Header */}
      <header className='flex justify-end self-end'>
        <div className='flex w-full gap-2 overflow-x-auto pb-1 xl:w-auto xl:flex-nowrap xl:overflow-visible'>
          <Button variant='outline' className='h-10 shrink-0 rounded-md px-4 text-xs sm:text-sm'>
            Today
          </Button>

          <Button
            variant='outline'
            size='icon'
            className='h-10 w-10 shrink-0 rounded-md'
            aria-label='Previous week'
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>

          {/* Date */}
          <div className='bg-card text-foreground flex h-10 shrink-0 items-center justify-center rounded-md border px-4 text-sm font-semibold whitespace-nowrap shadow-sm'>
            Jul 28 - Aug 3, 2025
          </div>

          <Button
            variant='outline'
            size='icon'
            className='h-10 w-10 shrink-0 rounded-md'
            aria-label='Next week'
          >
            <ChevronRight className='h-4 w-4' />
          </Button>

          {/* View switcher */}
          <div className='bg-card flex h-10 shrink-0 overflow-hidden rounded-md border shadow-sm'>
            {['Week', 'Month', 'Year'].map((view, index) => (
              <Button
                key={view}
                variant={index === 0 ? 'secondary' : 'ghost'}
                className='h-10 shrink-0 rounded-none px-3 text-xs whitespace-nowrap sm:px-4 sm:text-sm'
              >
                {view}
              </Button>
            ))}
          </div>

          {/* Schedule count */}
          <div className='bg-card text-foreground flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-xs font-semibold whitespace-nowrap shadow-sm sm:text-sm'>
            <CalendarDays className='text-primary h-4 w-4' />
            {schedulerEvents.length} schedules
          </div>

          <Button
            variant='outline'
            size='icon'
            className='h-10 w-10 shrink-0 rounded-md'
            aria-label='Calendar settings'
          >
            <Settings className='h-4 w-4' />
          </Button>
        </div>
      </header>

      {/* Main layout */}
      <div className='flex min-w-0 flex-col gap-4 min-[1800px]:flex-row min-[1800px]:items-start'>
        <div className='flex min-w-0 flex-1 flex-col gap-4'>
          {/* Metrics */}
          <div className='grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            {schedulerMetrics.map(metric => (
              <SchedulerStatCard key={metric.label} metric={metric} />
            ))}
          </div>

          <div className='flex flex-wrap items-center justify-between gap-2 min-[1800px]:hidden'>
            <Button
              variant='outline'
              className='h-10 rounded-md px-3 text-xs sm:text-sm'
              onClick={() => setFiltersOpen(true)}
            >
              <Filter className='h-4 w-4' />
              Filters
            </Button>

            <Button
              variant='outline'
              className='h-10 rounded-md px-3 text-xs sm:text-sm'
              onClick={() => setDetailsOpen(true)}
            >
              <Info className='h-4 w-4' />
              Details
            </Button>
          </div>

          <div className='flex min-w-0 flex-col gap-4 min-[1800px]:flex-row min-[1800px]:items-start'>
            <div className='hidden min-[1800px]:block'>
              <SchedulerFilters />
            </div>

            <SchedulerGrid />
          </div>
        </div>

        <div className='hidden min-[1800px]:block'>
          <SchedulerRightRail />
        </div>
      </div>

      {/* Legend + export */}
      <div className='bg-card flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2 shadow-sm'>
        <div className='flex flex-wrap items-center gap-3'>
          {(Object.keys(categoryDotStyles) as Array<keyof typeof categoryDotStyles>).map(
            category => (
              <span
                key={category}
                className='text-muted-foreground flex items-center gap-1.5 text-xs'
              >
                <span className={`h-3 w-3 rounded ${categoryDotStyles[category]}`} />
                {category}
              </span>
            )
          )}
        </div>

        <Button variant='outline' className='h-9 rounded-md text-xs sm:text-sm'>
          <Download className='h-4 w-4' />
          Export Schedule
          <CalendarDays className='h-4 w-4' />
        </Button>
      </div>

      {/* Filters sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side='left' className='w-[92vw] max-w-sm overflow-y-auto p-3'>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Filter classes without reducing calendar space.</SheetDescription>
          </SheetHeader>
          <SchedulerFilters />
        </SheetContent>
      </Sheet>

      {/* Details sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side='right' className='w-[94vw] max-w-md overflow-y-auto p-3'>
          <SheetHeader>
            <SheetTitle>Schedule Details</SheetTitle>
            <SheetDescription>
              Today&apos;s sessions, students, location, notes, and sharing.
            </SheetDescription>
          </SheetHeader>
          <SchedulerRightRail />
        </SheetContent>
      </Sheet>
    </main>
  );
}
