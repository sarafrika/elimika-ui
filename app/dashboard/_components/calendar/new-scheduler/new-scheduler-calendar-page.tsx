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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useInstructor } from '@/context/instructor-context';
import { useStudent } from '@/context/student-context';
import useAmdinClassesWithDetails from '@/hooks/use-admin-classes';
import {
  getInstructorByUuidOptions,
  getInstructorScheduleOptions,
  getStudentScheduleOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ScheduledInstance, StudentSchedule } from '@/services/client/types.gen';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
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
import { useMemo, useState } from 'react';
import { categoryDotStyles, schedulerMetrics } from './data';
import { SchedulerFilters } from './scheduler-filters';
import { SchedulerGrid } from './scheduler-grid';
import { SchedulerRightRail } from './scheduler-right-rail';
import { SchedulerStatCard } from './scheduler-stat-card';
import type {
  SchedulerCategory,
  SchedulerEvent,
  SchedulerFilterOptions,
  SchedulerFilterValues,
  SchedulerMetric,
  SchedulerProfile,
  SchedulerView,
} from './types';

type Props = {
  profile: SchedulerProfile;
};

type SchedulePreferences = {
  defaultClassDuration: string;
  eventColorMode: string;
  location: string;
  showHolidays: boolean;
  showWeekends: boolean;
  timezone: string;
  workingHoursEnd: string;
  workingHoursStart: string;
};

type ClassScheduleInput = {
  uuid?: string | null;
  instructor_uuid?: string | null;
  start_time?: Date | string | null;
  end_time?: Date | string | null;
  title?: string | null;
  location_name?: string | null;
  location_type?: string | null;
  max_participants?: number | null;
  status?: string | null;
};

type ClassWithScheduleInput = {
  uuid?: string | null;
  title?: string | null;
  course?: { name?: string | null } | null;
  instructor?: { full_name?: string | null; uuid?: string | null } | null;
  default_instructor_uuid?: string | null;
  location_name?: string | null;
  max_participants?: number | null;
  schedule?: ClassScheduleInput[] | null;
};

const DEFAULT_PREFERENCES: SchedulePreferences = {
  defaultClassDuration: '60',
  eventColorMode: 'category',
  location: 'Main campus',
  showHolidays: true,
  showWeekends: true,
  timezone: 'Africa/Lagos',
  workingHoursEnd: '18:00',
  workingHoursStart: '08:00',
};

const DEFAULT_FILTERS: SchedulerFilterValues = {
  category: '',
  course: '',
  instructor: '',
  location: '',
  statuses: [],
};

const TIME_OPTIONS = Array.from({ length: 18 }, (_, index) => {
  const hour = index + 5;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const toApiDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}` as unknown as Date;
};

const formatDateRange = (date: Date, view: SchedulerView) => {
  if (view === 'month') {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  if (view === 'year') {
    return String(date.getFullYear());
  }

  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

const getNavigationStep = (date: Date, view: SchedulerView, direction: -1 | 1) => {
  const next = new Date(date);

  if (view === 'month') {
    next.setMonth(next.getMonth() + direction);
    return next;
  }

  if (view === 'year') {
    next.setFullYear(next.getFullYear() + direction);
    return next;
  }

  next.setDate(next.getDate() + direction * 7);
  return next;
};

const formatStatus = (status?: string | null) =>
  status
    ? status
        .toLowerCase()
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'Scheduled';

const inferCategory = (value?: string | null): SchedulerCategory => {
  const normalized = value?.toLowerCase() ?? '';
  if (normalized.includes('sport') || normalized.includes('basket')) return 'Sports';
  if (normalized.includes('cert') || normalized.includes('aws')) return 'Certifications';
  if (
    normalized.includes('design') ||
    normalized.includes('art') ||
    normalized.includes('animation')
  ) {
    return 'Arts';
  }
  if (
    normalized.includes('coding') ||
    normalized.includes('robot') ||
    normalized.includes('digital')
  ) {
    return 'STEM';
  }
  return 'TVET / Vocational';
};

const makeInitials = (value?: string | null) =>
  (value || 'Student')
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

function mapScheduledInstance(
  instance: ScheduledInstance,
  instructorName: string
): SchedulerEvent | null {
  if (!instance.start_time || !instance.end_time) return null;

  return {
    id: instance.uuid || `${instance.class_definition_uuid}-${instance.start_time}`,
    title: instance.title || 'Scheduled class',
    course: instance.title || 'Class',
    instructor: instructorName,
    instructorUuid: instance.instructor_uuid,
    location: instance.location_name || 'Location pending',
    startTime: new Date(instance.start_time),
    endTime: new Date(instance.end_time),
    status: formatStatus(instance.status),
    category: inferCategory(instance.title),
    students: [makeInitials(instructorName), 'ST', 'EN'],
    maxParticipants: instance.max_participants,
  };
}

function mapStudentSchedule(item: StudentSchedule, instructorName: string): SchedulerEvent | null {
  if (!item.start_time || !item.end_time) return null;

  return {
    id: item.scheduled_instance_uuid || item.enrollment_uuid || `${item.title}-${item.start_time}`,
    title: item.title || 'Scheduled class',
    course: item.title || 'Class',
    instructor: instructorName,
    instructorUuid: item.instructor_uuid,
    location: item.location_name || 'Location pending',
    startTime: new Date(item.start_time),
    endTime: new Date(item.end_time),
    status: formatStatus(item.scheduling_status || item.enrollment_status),
    category: inferCategory(item.title),
    students: ['ME'],
    maxParticipants: 1,
  };
}

function mapClassSchedule(classDef: ClassWithScheduleInput, classIndex: number): SchedulerEvent[] {
  return (classDef.schedule ?? [])
    .filter(schedule => schedule.start_time && schedule.end_time)
    .map((schedule, scheduleIndex) => ({
      id: schedule.uuid || `${classDef.uuid}-${schedule.start_time}-${scheduleIndex}`,
      title: schedule.title || classDef.title || classDef.course?.name || 'Scheduled class',
      course: classDef.course?.name || classDef.title || 'Class',
      instructor: classDef.instructor?.full_name || 'Instructor pending',
      instructorUuid: schedule.instructor_uuid || classDef.default_instructor_uuid || undefined,
      location: schedule.location_name || classDef.location_name || 'Location pending',
      startTime: new Date(schedule.start_time as Date | string),
      endTime: new Date(schedule.end_time as Date | string),
      status: formatStatus(schedule.status),
      category: inferCategory(classDef.course?.name || classDef.title),
      students: [makeInitials(classDef.instructor?.full_name), `S${classIndex}`, 'EN'],
      maxParticipants: schedule.max_participants || classDef.max_participants || undefined,
    }));
}

export function NewSchedulerCalendarPage({ profile }: Props) {
  const instructor = useInstructor();
  const student = useStudent();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<SchedulerView>('week');
  const [preloadAnchor] = useState(() => new Date());
  const [filters, setFilters] = useState<SchedulerFilterValues>(DEFAULT_FILTERS);
  const [preferences, setPreferences] = useState<SchedulePreferences>(DEFAULT_PREFERENCES);

  const createLabel = profile === 'student' ? 'View Session' : 'Create Session';
  const rangeStart = useMemo(
    () => toApiDate(new Date(preloadAnchor.getFullYear() - 1, 0, 1)),
    [preloadAnchor]
  );
  const rangeEnd = useMemo(
    () => toApiDate(new Date(preloadAnchor.getFullYear() + 1, 11, 31)),
    [preloadAnchor]
  );

  const instructorScheduleQuery = useQuery({
    ...getInstructorScheduleOptions({
      path: { instructorUuid: instructor?.uuid ?? '' },
      query: { start: rangeStart, end: rangeEnd },
    }),
    enabled: profile === 'instructor' && !!instructor?.uuid,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const studentScheduleQuery = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: student?.uuid ?? '' },
      query: { start: rangeStart, end: rangeEnd },
    }),
    enabled: profile === 'student' && !!student?.uuid,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { classes: classData, loading: organizationLoading } = useAmdinClassesWithDetails();

  // get student instrcutor for classes from the classData.
  // or use the instructor uuid from the studentScheduleQuery to get the instructor name.
  // but the instructor uuid from both sources must match for the same class schedule item.
  const studentInstructorUuids = useMemo(
    () =>
      Array.from(
        new Set(
          (studentScheduleQuery.data?.data ?? []).map(item => item.instructor_uuid).filter(Boolean)
        )
      ) as string[],
    [studentScheduleQuery.data]
  );

  const studentInstructorQueries = useQueries({
    queries: studentInstructorUuids.map(uuid => ({
      ...getInstructorByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });

  const studentInstructorNames = useMemo(() => {
    const map = new Map<string, string>();
    studentInstructorQueries.forEach(query => {
      const value = query.data;
      if (value?.uuid) map.set(value.uuid, value.full_name || 'Instructor pending');
    });
    return map;
  }, [studentInstructorQueries]);

  const schedulerEvents = useMemo<SchedulerEvent[]>(() => {
    if (profile === 'student') {
      return (studentScheduleQuery.data?.data ?? [])
        .map(item =>
          mapStudentSchedule(
            item,
            studentInstructorNames.get(item.instructor_uuid || '') || 'Instructor pending'
          )
        )
        .filter((item): item is SchedulerEvent => Boolean(item))
        .sort((left, right) => left.startTime.getTime() - right.startTime.getTime());
    }

    if (profile === 'instructor') {
      return (instructorScheduleQuery.data?.data ?? [])
        .map(item => mapScheduledInstance(item, instructor?.full_name || 'Instructor pending'))
        .filter((item): item is SchedulerEvent => Boolean(item))
        .sort((left, right) => left.startTime.getTime() - right.startTime.getTime());
    }

    return ((classData ?? []) as ClassWithScheduleInput[])
      .flatMap((classDef, classIndex) => mapClassSchedule(classDef, classIndex))
      .sort((left, right) => left.startTime.getTime() - right.startTime.getTime());
  }, [
    classData,
    instructor?.full_name,
    instructorScheduleQuery.data,
    profile,
    studentInstructorNames,
    studentScheduleQuery.data,
  ]);

  const instructors = useMemo(
    () =>
      Array.from(new Set(schedulerEvents.map(event => event.instructor).filter(Boolean))).sort(),
    [schedulerEvents]
  );

  const filterOptions = useMemo<SchedulerFilterOptions>(
    () => ({
      category: Array.from(new Set(schedulerEvents.map(event => event.category))).sort(),
      course: Array.from(
        new Set(schedulerEvents.map(event => event.course).filter(Boolean))
      ).sort(),
      instructor: instructors,
      location: Array.from(
        new Set(schedulerEvents.map(event => event.location).filter(Boolean))
      ).sort(),
      statuses: Array.from(
        new Set(schedulerEvents.map(event => event.status || 'Scheduled').filter(Boolean))
      ).sort(),
    }),
    [instructors, schedulerEvents]
  );

  const filteredEvents = useMemo(
    () =>
      schedulerEvents.filter(event => {
        if (filters.course && event.course !== filters.course) return false;
        if (filters.instructor && event.instructor !== filters.instructor) return false;
        if (filters.location && event.location !== filters.location) return false;
        if (filters.category && event.category !== filters.category) return false;
        if (filters.statuses.length && !filters.statuses.includes(event.status || 'Scheduled')) {
          return false;
        }
        return true;
      }),
    [filters, schedulerEvents]
  );

  const visibleInstructors = useMemo(
    () => Array.from(new Set(filteredEvents.map(event => event.instructor).filter(Boolean))).sort(),
    [filteredEvents]
  );

  const isLoading =
    profile === 'student'
      ? studentScheduleQuery.isLoading
      : profile === 'instructor'
        ? instructorScheduleQuery.isLoading
        : organizationLoading;

  const metrics = useMemo<SchedulerMetric[]>(
    () => [
      {
        ...(schedulerMetrics[0] as SchedulerMetric),
        value: String(new Set(filteredEvents.map(event => event.title)).size),
      },
      { ...(schedulerMetrics[1] as SchedulerMetric), value: String(visibleInstructors.length) },
      {
        ...(schedulerMetrics[2] as SchedulerMetric),
        value: `${new Set(filteredEvents.map(event => event.location).filter(Boolean)).size}`,
      },
      {
        ...(schedulerMetrics[3] as SchedulerMetric),
        value: String(
          filteredEvents.filter(event => event.startTime.getTime() >= Date.now()).length
        ),
      },
    ],
    [filteredEvents, visibleInstructors.length]
  );

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
          <Button
            variant='outline'
            className='h-10 shrink-0 rounded-md px-4 text-xs sm:text-sm'
            onClick={() => setCurrentDate(new Date())}
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

          {/* Date */}
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

          {/* View switcher */}
          <div className='bg-card flex h-10 shrink-0 overflow-hidden rounded-md border shadow-sm'>
            {(['week', 'month', 'year'] as SchedulerView[]).map(item => (
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

          {/* Schedule count */}
          <div className='bg-card text-foreground flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-xs font-semibold whitespace-nowrap shadow-sm sm:text-sm'>
            <CalendarDays className='text-primary h-4 w-4' />
            {filteredEvents.length} schedules
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

      {/* Main layout */}
      <div className='flex min-w-0 flex-col gap-4 min-[1800px]:flex-row min-[1800px]:items-start'>
        <div className='flex min-w-0 flex-1 flex-col gap-4'>
          {/* Metrics */}
          <div className='grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            {metrics.map(metric => (
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
              <SchedulerGrid currentDate={currentDate} events={filteredEvents} view={view} />
            )}
          </div>
        </div>

        <div className='hidden min-[1800px]:block'>
          <SchedulerRightRail events={filteredEvents} instructors={visibleInstructors} />
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

      {/* Details sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side='right' className='w-[94vw] max-w-md overflow-y-auto p-3'>
          <SheetHeader>
            <SheetTitle>Schedule Details</SheetTitle>
            <SheetDescription>
              Today&apos;s sessions, students, location, notes, and sharing.
            </SheetDescription>
          </SheetHeader>
          <SchedulerRightRail events={filteredEvents} instructors={visibleInstructors} />
        </SheetContent>
      </Sheet>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-xl'>
          <SheetHeader>
            <SheetTitle>Calendar settings</SheetTitle>
            <SheetDescription>
              Adjust view preferences, timezone, location, and scheduling defaults.
            </SheetDescription>
          </SheetHeader>

          <div className='space-y-6 px-3 pb-6 sm:px-6'>
            <section className='space-y-4'>
              <div>
                <h3 className='text-foreground text-sm font-semibold'>View and appearance</h3>
                <p className='text-muted-foreground text-sm'>
                  Control how schedule cards are grouped and displayed.
                </p>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='event-color-mode'>Event colors</Label>
                <Select
                  value={preferences.eventColorMode}
                  onValueChange={value =>
                    setPreferences(prev => ({ ...prev, eventColorMode: value }))
                  }
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
                  <p className='text-muted-foreground text-xs'>
                    Reserve space for holiday indicators.
                  </p>
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
