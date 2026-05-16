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
import { CalendarDays, ChevronLeft, ChevronRight, Filter, Info, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { SchedulerCalendarData } from './calendar-utils';
import {
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
import type {
  SchedulerEvent,
  SchedulerFilterSection,
  SchedulerMetric,
  SchedulerProfile,
  SchedulerView,
} from './types';

type Props = {
  profile: SchedulerProfile;
  data: SchedulerCalendarData;
};

type FilterSelection =
  | { id: 'all'; kind: 'all' }
  | { id: string; kind: 'class' | 'booking' | 'venue' | 'classroom' };

const normalizeText = (value?: string | null) => value?.trim().toLowerCase() ?? '';

const isVenueLocation = (value?: string | null) => {
  const normalized = normalizeText(value);
  return Boolean(normalized) && !normalized.includes('room') && !normalized.includes('classroom');
};

const isClassroomLocation = (value?: string | null) => {
  const normalized = normalizeText(value);
  return normalized.includes('room') || normalized.includes('classroom');
};

export function SchedulerCalendarView({ profile, data }: Props) {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<SchedulerView>('week');
  const [showAllInstructors, setShowAllInstructors] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterSelection>({ id: 'all', kind: 'all' });
  const [openDropdowns, setOpenDropdowns] = useState({
    bookings: true,
    classes: true,
    classrooms: true,
    venues: true,
  });
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  const events = data.events;
  const allInstructorSummaries = data.allInstructors.length > 0 ? data.allInstructors : data.instructors;
  const studentSummaries = data.students;

  const allEvents = useMemo(() => events, [events]);
  const filteredEvents = useMemo(
    () =>
      allEvents.filter(event => {
        if (selectedFilter.kind === 'class' && event.classDefinitionUuid !== selectedFilter.id) return false;
        if (selectedFilter.kind === 'booking' && event.eventType !== 'booking_request') return false;
        if (
          (selectedFilter.kind === 'venue' || selectedFilter.kind === 'classroom') &&
          event.location !== selectedFilter.id
        ) {
          return false;
        }
        return true;
      }),
    [allEvents, selectedFilter]
  );

  const visibleEvents = useMemo(
    () =>
      view === 'day'
        ? filteredEvents.filter(entry => isSameCalendarDay(entry.startTime, currentDate))
        : filteredEvents,
    [currentDate, filteredEvents, view]
  );

  const searchTerm = normalizeText(searchQuery);

  const classFilterItems = useMemo(() => {
    const items = Array.from(
      new Map(
        allEvents
          .filter(event => Boolean(event.classDefinitionUuid))
          .map(event => [
            event.classDefinitionUuid as string,
            {
              id: event.classDefinitionUuid as string,
              name: `${event.title}${event.course ? ` - ${event.course}` : ''}`,
            },
          ])
      ).values()
    ).sort((left, right) => left.name.localeCompare(right.name));

    return items.filter(item => !searchTerm || item.name.toLowerCase().includes(searchTerm));
  }, [allEvents, searchTerm]);

  const bookingFilterItems = useMemo(() => {
    const bookingCount = allEvents.filter(event => event.eventType === 'booking_request').length;
    if (!bookingCount) return [];

    const items = [
      {
        id: 'booking-requests',
        name: `Booking Requests (${bookingCount})`,
      },
    ];

    return items.filter(item => !searchTerm || item.name.toLowerCase().includes(searchTerm));
  }, [allEvents, searchTerm]);

  const venueFilterItems = useMemo(() => {
    const items = Array.from(
      new Set(
        allEvents
          .filter(event => isVenueLocation(event.location))
          .map(event => event.location)
          .filter(Boolean)
      )
    )
      .map(location => ({ id: location, name: location }))
      .sort((left, right) => left.name.localeCompare(right.name));

    return items.filter(item => !searchTerm || item.name.toLowerCase().includes(searchTerm));
  }, [allEvents, searchTerm]);

  const classroomFilterItems = useMemo(() => {
    const items = Array.from(
      new Set(
        allEvents
          .filter(event => isClassroomLocation(event.location))
          .map(event => event.location)
          .filter(Boolean)
      )
    )
      .map(location => ({ id: location, name: location }))
      .sort((left, right) => left.name.localeCompare(right.name));

    return items.filter(item => !searchTerm || item.name.toLowerCase().includes(searchTerm));
  }, [allEvents, searchTerm]);

  const activeDayEntries = useMemo(
    () => filteredEvents.filter(entry => isSameCalendarDay(entry.startTime, currentDate)),
    [currentDate, filteredEvents]
  );

  const activeDayEvents = useMemo(() => activeDayEntries, [activeDayEntries]);

  const filteredVisibleInstructors = useMemo(
    () => Array.from(new Set(activeDayEvents.map(event => event.instructor).filter(Boolean))).sort(),
    [activeDayEvents]
  );

  const hasActiveFilters = selectedFilter.kind !== 'all';

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

  const filterSections = useMemo<SchedulerFilterSection[]>(
    () => [
      {
        count: bookingFilterItems.length,
        isOpen: openDropdowns.bookings,
        items: bookingFilterItems,
        key: 'bookings',
        label: 'Booking Requests',
        onItemClick: id => {
          setSelectedFilter({ id, kind: 'booking' });
          setFiltersOpen(false);
        },
        onToggle: () => setOpenDropdowns(prev => ({ ...prev, bookings: !prev.bookings })),
        selectedId: selectedFilter.kind === 'booking' ? selectedFilter.id : null,
      },
      {
        count: classFilterItems.length,
        isOpen: openDropdowns.classes,
        items: classFilterItems,
        key: 'classes',
        label: 'Classes',
        onItemClick: id => {
          setSelectedFilter({ id, kind: 'class' });
          setFiltersOpen(false);
        },
        onToggle: () => setOpenDropdowns(prev => ({ ...prev, classes: !prev.classes })),
        selectedId: selectedFilter.kind === 'class' ? selectedFilter.id : null,
      },
      {
        count: venueFilterItems.length,
        isOpen: openDropdowns.venues,
        items: venueFilterItems,
        key: 'venues',
        label: 'Venues',
        onItemClick: id => {
          setSelectedFilter({ id, kind: 'venue' });
          setFiltersOpen(false);
        },
        onToggle: () => setOpenDropdowns(prev => ({ ...prev, venues: !prev.venues })),
        selectedId: selectedFilter.kind === 'venue' ? selectedFilter.id : null,
      },
      {
        count: classroomFilterItems.length,
        isOpen: openDropdowns.classrooms,
        items: classroomFilterItems,
        key: 'classrooms',
        label: 'Classrooms',
        onItemClick: id => {
          setSelectedFilter({ id, kind: 'classroom' });
          setFiltersOpen(false);
        },
        onToggle: () => setOpenDropdowns(prev => ({ ...prev, classrooms: !prev.classrooms })),
        selectedId: selectedFilter.kind === 'classroom' ? selectedFilter.id : null,
      },
    ],
    [
      bookingFilterItems,
      classFilterItems,
      classroomFilterItems,
      openDropdowns.bookings,
      openDropdowns.classes,
      openDropdowns.classrooms,
      openDropdowns.venues,
      selectedFilter,
      venueFilterItems,
    ]
  );

  return (
    <main className='bg-background space-y-4 pt-4 pb-8 px-4'>
      <div className='w-full'>
        <h1 className='text-foreground text-2xl font-semibold sm:text-3xl'>Calendar / Scheduler</h1>
        <p className='text-muted-foreground mt-1 text-sm'>Manage Classes, Venues &amp; Instructors</p>
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
                activeFilterCount={Number(selectedFilter.kind !== 'all')}
                onClearFilters={() => {
                  setSelectedFilter({ id: 'all', kind: 'all' });
                  setSearchQuery('');
                }}
                onSearchChange={setSearchQuery}
                searchQuery={searchQuery}
                sections={filterSections}
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
            activeFilterCount={Number(selectedFilter.kind !== 'all')}
            onClearFilters={() => {
              setSelectedFilter({ id: 'all', kind: 'all' });
              setSearchQuery('');
            }}
            onSearchChange={setSearchQuery}
            searchQuery={searchQuery}
            sections={filterSections}
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
