'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { CalendarDays, ChevronLeft, ChevronRight, Filter, Info, Plus, Search, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { SchedulerCalendarData } from './calendar-utils';
import {
  DEFAULT_FILTERS,
  DEFAULT_PREFERENCES,
  TIME_OPTIONS,
  findClosestDate,
  formatDateRange,
  getDateKey,
  getNavigationStep,
  getTimeValue,
  isSameCalendarDay,
} from './calendar-utils';
import { schedulerMetrics } from './data';
import { SchedulerFilters } from './scheduler-filters';
import { SchedulerGrid } from './scheduler-grid';
import { SchedulerRightRail } from './scheduler-right-rail';
import { SchedulerStatCard } from './scheduler-stat-card';
import type { SchedulerEvent, SchedulerFilterOptions, SchedulerFilterValues, SchedulerMetric, SchedulerProfile, SchedulerView } from './types';

type Props = {
  profile: SchedulerProfile;
  data: SchedulerCalendarData;
};

export function SchedulerCalendarView({ profile, data }: Props) {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<SchedulerView>('week');
  const [showAllInstructors, setShowAllInstructors] = useState(false);
  const [filters, setFilters] = useState<SchedulerFilterValues>(DEFAULT_FILTERS);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  const createLabel = profile === 'student' ? 'View Session' : 'Create Session';
  const events = data.events;
  const allInstructorSummaries = data.allInstructors.length > 0 ? data.allInstructors : data.instructors;
  const studentSummaries = data.students;

  const allEvents = useMemo(() => events, [events]);
  const filteredEvents = useMemo(
    () =>
      allEvents.filter(event => {
        if (filters.course && event.course !== filters.course) return false;
        if (filters.instructor && event.instructor !== filters.instructor) return false;
        if (filters.location && event.location !== filters.location) return false;
        if (filters.category && event.category !== filters.category) return false;
        if (filters.statuses.length && !filters.statuses.includes(event.status || 'Scheduled')) {
          return false;
        }
        return true;
      }),
    [allEvents, filters]
  );

  const visibleEvents = useMemo(
    () =>
      view === 'day'
        ? filteredEvents.filter(entry => isSameCalendarDay(entry.startTime, currentDate))
        : filteredEvents,
    [currentDate, filteredEvents, view]
  );

  const filterOptions = useMemo<SchedulerFilterOptions>(
    () => ({
      category: Array.from(new Set(allEvents.map(event => event.category))).sort(),
      course: Array.from(new Set(allEvents.map(event => event.course).filter(Boolean))).sort(),
      instructor: Array.from(new Set(allEvents.map(event => event.instructor).filter(Boolean))).sort(),
      location: Array.from(new Set(allEvents.map(event => event.location).filter(Boolean))).sort(),
      statuses: Array.from(new Set(allEvents.map(event => event.status || 'Scheduled').filter(Boolean))).sort(),
    }),
    [allEvents]
  );

  const activeDayEntries = useMemo(
    () => filteredEvents.filter(entry => isSameCalendarDay(entry.startTime, currentDate)),
    [currentDate, filteredEvents]
  );

  const activeDayEvents = useMemo(() => activeDayEntries, [activeDayEntries]);

  const filteredVisibleInstructors = useMemo(
    () => Array.from(new Set(activeDayEvents.map(event => event.instructor).filter(Boolean))).sort(),
    [activeDayEvents]
  );

  const hasActiveFilters =
    Boolean(filters.course || filters.instructor || filters.location || filters.category) ||
    filters.statuses.length > 0;

  useEffect(() => {
    if (!hasActiveFilters || !filteredEvents.length) return;

    const closest = findClosestDate(
      currentDate,
      filteredEvents
    );
    if (!isSameCalendarDay(closest, currentDate)) {
      setCurrentDate(closest);
    }
  }, [currentDate, filteredEvents, hasActiveFilters]);

  const activeEvents = visibleEvents;

  const metrics = useMemo<SchedulerMetric[]>(
    () => [
      {
        ...(schedulerMetrics[0] as SchedulerMetric),
        value: String(new Set(activeEvents.map(event => event.title)).size),
      },
      { ...(schedulerMetrics[1] as SchedulerMetric), value: String(filteredVisibleInstructors.length) },
      {
        ...(schedulerMetrics[2] as SchedulerMetric),
        value: `${new Set(activeEvents.map(event => event.location).filter(Boolean)).size}`,
      },
      {
        ...(schedulerMetrics[3] as SchedulerMetric),
        value: String(activeEvents.filter(event => event.startTime.getTime() >= Date.now()).length),
      },
    ],
    [activeEvents, filteredVisibleInstructors.length]
  );

  const isLoading = data.isLoading;

  const handleEventClick = (event: SchedulerEvent) => {
    const instanceUuid = event.instanceUuid || event.id;
    if (!instanceUuid) return;

    router.push(`/dashboard/class-instance/${instanceUuid}`);
  };

  const handleCreateSession = (slot?: { date: Date; startTime: Date; endTime: Date }) => {
    if (profile === 'student') {
      setDetailsOpen(true);
      return;
    }

    const params = new URLSearchParams();

    if (slot) {
      params.set('date', getDateKey(slot.date));
      params.set('startTime', getTimeValue(slot.startTime));
      params.set('endTime', getTimeValue(slot.endTime));
    }

    router.push(`/dashboard/classes/create-new${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleEmptySlotClick = (slot: { date: Date; startTime: Date; endTime: Date }) => {
    if (profile === 'student') return;
    handleCreateSession(slot);
  };

  return (
    <main className='bg-background space-y-4 pb-8'>
      <div className='w-full'>
        <h1 className='text-foreground text-2xl font-semibold sm:text-3xl'>Calendar / Scheduler</h1>
        <p className='text-muted-foreground mt-1 text-sm'>Manage Classes, Venues &amp; Instructors</p>
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
          <Button className='h-10 rounded-md px-4 text-xs sm:text-sm' onClick={() => handleCreateSession()}>
            <Plus className='h-4 w-4' />
            {createLabel}
          </Button>
        </div>
      </div>

      <header className='flex justify-end self-end'>
        <div className='flex w-full gap-2 overflow-x-auto pb-1 xl:w-auto xl:flex-nowrap xl:overflow-visible'>
          <Button
            variant='outline'
            className='h-10 shrink-0 rounded-md px-4 text-xs sm:text-sm'
            onClick={() => {
              setCurrentDate(new Date());
              setView('day');
            }}
          >
            Today
          </Button>

          <Button
            variant='outline'
            size='icon'
            className='h-10 w-10 shrink-0 rounded-md'
            aria-label={`Previous ${view}`}
            onClick={() => setCurrentDate(date => getNavigationStep(date, view, -1))}
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>

          <div className='bg-card text-foreground flex h-10 shrink-0 items-center justify-center rounded-md border px-4 text-sm font-semibold whitespace-nowrap shadow-sm'>
            {formatDateRange(currentDate, view)}
          </div>

          <Button
            variant='outline'
            size='icon'
            className='h-10 w-10 shrink-0 rounded-md'
            aria-label={`Next ${view}`}
            onClick={() => setCurrentDate(date => getNavigationStep(date, view, 1))}
          >
            <ChevronRight className='h-4 w-4' />
          </Button>

          <div className='bg-card flex h-10 shrink-0 overflow-hidden rounded-md border shadow-sm'>
            {(['day', 'week', 'month', 'year'] as SchedulerView[]).map(item => (
              <Button
                key={item}
                variant={view === item ? 'secondary' : 'ghost'}
                className='h-10 shrink-0 rounded-none px-3 text-xs whitespace-nowrap sm:px-4 sm:text-sm'
                onClick={() => setView(item)}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Button>
            ))}
          </div>

          <div className='bg-card text-foreground flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-xs font-semibold whitespace-nowrap shadow-sm sm:text-sm'>
            <CalendarDays className='text-primary h-4 w-4' />
            {visibleEvents.length} schedules
          </div>

          <Button
            variant='outline'
            size='icon'
            className='h-10 w-10 shrink-0 rounded-md'
            aria-label='Calendar settings'
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className='h-4 w-4' />
          </Button>
        </div>
      </header>

      <div className='flex min-w-0 flex-col gap-4 min-[1300px]:flex-row min-[1300px]:items-start'>
        <div className='flex min-w-0 flex-1 flex-col gap-4'>
          <div className='grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            {metrics.map(metric => (
              <SchedulerStatCard key={metric.label} metric={metric} />
            ))}
          </div>

          <div className='flex flex-wrap items-center justify-between gap-2 min-[1600px]:hidden'>
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

          <div className='flex min-w-0 flex-col gap-4 min-[1300px]:flex-row min-[1300px]:items-start'>
            <div className='hidden min-[1300px]:block'>
              <SchedulerFilters
                options={filterOptions}
                values={filters}
                onChange={setFilters}
                onClear={() => setFilters(DEFAULT_FILTERS)}
              />
            </div>

            {isLoading ? (
              <div className='bg-card flex min-h-[420px] w-full items-center justify-center rounded-md border p-6 shadow-sm'>
                <div className='flex flex-col items-center text-center'>
                  <div className='border-primary mb-3 h-10 w-10 animate-spin rounded-full border-2 border-t-transparent' />
                  <p className='text-muted-foreground text-sm'>Loading schedule data...</p>
                </div>
              </div>
            ) : (
              <SchedulerGrid
                currentDate={currentDate}
                events={visibleEvents}
                view={view}
                onEventClick={handleEventClick}
                onEmptySlotClick={handleEmptySlotClick}
              />
            )}
          </div>
        </div>

        <div className='hidden min-[1600px]:block'>
          <SchedulerRightRail
            currentDate={currentDate}
            events={visibleEvents}
            allInstructors={allInstructorSummaries}
            students={studentSummaries}
            showAllInstructors={showAllInstructors}
            onToggleInstructors={() => setShowAllInstructors(v => !v)}
          />
        </div>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side='left' className='h-full w-screen max-w-none overflow-y-auto p-3'>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Filter classes without reducing calendar space.</SheetDescription>
          </SheetHeader>

          <SchedulerFilters
            options={filterOptions}
            values={filters}
            onChange={setFilters}
            onClear={() => setFilters(DEFAULT_FILTERS)}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side='right' className='w-[94vw] max-w-md overflow-y-auto p-3'>
          <SheetHeader>
            <SheetTitle>Schedule Details</SheetTitle>
            <SheetDescription>Today&apos;s sessions, students, location, notes, and sharing.</SheetDescription>
          </SheetHeader>
          <SchedulerRightRail
            currentDate={currentDate}
            events={visibleEvents}
            allInstructors={allInstructorSummaries}
            students={studentSummaries}
            showAllInstructors={showAllInstructors}
            onToggleInstructors={() => setShowAllInstructors(v => !v)}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-xl'>
          <SheetHeader>
            <SheetTitle>Calendar settings</SheetTitle>
            <SheetDescription>Adjust view preferences, timezone, location, and scheduling defaults.</SheetDescription>
          </SheetHeader>

          <div className='space-y-6 px-3 pb-6 sm:px-6'>
            <section className='space-y-4'>
              <div>
                <h3 className='text-foreground text-sm font-semibold'>View and appearance</h3>
                <p className='text-muted-foreground text-sm'>Control how schedule cards are grouped and displayed.</p>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='event-color-mode'>Event colors</Label>
                <Select
                  value={preferences.eventColorMode}
                  onValueChange={value => setPreferences(prev => ({ ...prev, eventColorMode: value }))}
                >
                  <SelectTrigger id='event-color-mode'>
                    <SelectValue placeholder='Choose color mode' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='category'>By category</SelectItem>
                    <SelectItem value='instructor'>By instructor</SelectItem>
                    <SelectItem value='status'>By status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className='space-y-3'>
              <div className='flex items-center justify-between rounded-md border p-3'>
                <div>
                  <p className='text-foreground text-sm font-medium'>Show weekends</p>
                  <p className='text-muted-foreground text-xs'>Keep Saturday and Sunday visible.</p>
                </div>
                <Switch
                  checked={preferences.showWeekends}
                  onCheckedChange={checked =>
                    setPreferences(prev => ({ ...prev, showWeekends: checked }))
                  }
                />
              </div>
              <div className='flex items-center justify-between rounded-md border p-3'>
                <div>
                  <p className='text-foreground text-sm font-medium'>Show holidays</p>
                  <p className='text-muted-foreground text-xs'>Reserve space for holiday indicators.</p>
                </div>
                <Switch
                  checked={preferences.showHolidays}
                  onCheckedChange={checked =>
                    setPreferences(prev => ({ ...prev, showHolidays: checked }))
                  }
                />
              </div>
            </section>

            <section className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='calendar-timezone'>Timezone</Label>
                <Select
                  value={preferences.timezone}
                  onValueChange={value => setPreferences(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger id='calendar-timezone'>
                    <SelectValue placeholder='Choose timezone' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Africa/Lagos'>Africa/Lagos</SelectItem>
                    <SelectItem value='Africa/Nairobi'>Africa/Nairobi</SelectItem>
                    <SelectItem value='Europe/London'>Europe/London</SelectItem>
                    <SelectItem value='America/New_York'>America/New_York</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='calendar-location'>Default location</Label>
                <Input
                  id='calendar-location'
                  value={preferences.location}
                  onChange={event =>
                    setPreferences(prev => ({ ...prev, location: event.target.value }))
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='working-start'>Working hours start</Label>
                <Select
                  value={preferences.workingHoursStart}
                  onValueChange={value =>
                    setPreferences(prev => ({ ...prev, workingHoursStart: value }))
                  }
                >
                  <SelectTrigger id='working-start'>
                    <SelectValue placeholder='Select start time' />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map(time => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='working-end'>Working hours end</Label>
                <Select
                  value={preferences.workingHoursEnd}
                  onValueChange={value =>
                    setPreferences(prev => ({ ...prev, workingHoursEnd: value }))
                  }
                >
                  <SelectTrigger id='working-end'>
                    <SelectValue placeholder='Select end time' />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map(time => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2 sm:col-span-2'>
                <Label htmlFor='default-duration'>Default class duration</Label>
                <Select
                  value={preferences.defaultClassDuration}
                  onValueChange={value =>
                    setPreferences(prev => ({ ...prev, defaultClassDuration: value }))
                  }
                >
                  <SelectTrigger id='default-duration'>
                    <SelectValue placeholder='Select duration' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='30'>30 minutes</SelectItem>
                    <SelectItem value='45'>45 minutes</SelectItem>
                    <SelectItem value='60'>60 minutes</SelectItem>
                    <SelectItem value='90'>90 minutes</SelectItem>
                    <SelectItem value='120'>120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
