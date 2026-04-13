'use client';

import { useMutation, useQueries, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

import ClassBuilderPage from '@/app/dashboard/@instructor/trainings/create-new/page';
import {
  COLOR_PALETTE,
  ScheduleCalendarHeader,
  ScheduleCompactActions,
  ScheduleDayView,
  ScheduleFiltersPanel,
  ScheduleLoadingState,
  ScheduleMonthView,
  ScheduleSessionDetailsPanel,
  ScheduleWeekView,
  ScheduleYearView,
  Skeleton,
} from '@/components/schedule/ClassScheduleShared';
import type {
  CalendarEvent,
  ClassDefinition,
  ClassSchedule,
  ScheduleFilterSection,
  StudentEnrollment,
  ViewMode,
} from '@/components/schedule/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import useAmdinClassesWithDetails from '@/hooks/use-admin-classes';
import { useCompactScheduleLayout } from '@/hooks/use-compact-schedule-layout';
import { useStudentsMap } from '@/hooks/use-studentsMap';
import {
  acceptBookingMutation,
  declineBookingMutation,
  getEnrollmentsForInstanceOptions,
  getInstructorBookingsOptions,
  getStudentByIdOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { BookingResponse, StatusEnum9 } from '@/services/client/types.gen';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';

type FilterSelection =
  | { id: 'all'; kind: 'all' }
  | { id: string; kind: 'class' | 'booking' | 'venue' | 'classroom' };

type SchedulePreferences = {
  classTheme: string;
  defaultClassDuration: string;
  eventColorMode: string;
  location: string;
  showHolidays: boolean;
  showWeekends: boolean;
  timezone: string;
  workingHoursEnd: string;
  workingHoursStart: string;
};

const SETTINGS_STORAGE_KEY = 'instructor-schedule-preferences:v1';
const REQUEST_STATUSES: StatusEnum9[] = ['accepted', 'payment_failed', 'payment_required'];
const TIME_OPTIONS = Array.from({ length: 18 }, (_, index) => {
  const hour = index + 5;
  return `${hour.toString().padStart(2, '0')}:00`;
});
const DEFAULT_PREFERENCES: SchedulePreferences = {
  classTheme: 'Ocean',
  defaultClassDuration: '60',
  eventColorMode: 'class',
  location: 'Main campus',
  showHolidays: true,
  showWeekends: true,
  timezone: 'Africa/Lagos',
  workingHoursEnd: '18:00',
  workingHoursStart: '08:00',
};

const normalizeText = (value?: string | null) => value?.trim().toLowerCase() ?? '';

const isVenueLocation = (value?: string | null) => {
  const normalized = normalizeText(value);
  return Boolean(normalized) && !normalized.includes('room') && !normalized.includes('classroom');
};

const isClassroomLocation = (value?: string | null) => {
  const normalized = normalizeText(value);
  return normalized.includes('room') || normalized.includes('classroom');
};

const formatDateKey = (value: Date) => value.toISOString().slice(0, 10);

export default function InstructorClassPage() {
  const instructor = useInstructor();
  const isCompactLayout = useCompactScheduleLayout();

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterSelection>({ id: 'all', kind: 'all' });
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    bookings: true,
    classes: true,
    classrooms: true,
    venues: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltersSheetOpen, setIsFiltersSheetOpen] = useState(false);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ endTime: Date; startTime: Date } | null>(null);
  const [preferences, setPreferences] = useState<SchedulePreferences>(DEFAULT_PREFERENCES);
  const lastAutoFocusKeyRef = useRef<string | null>(null);

  const { classes: classData, isPending } = useAmdinClassesWithDetails();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedPreferences = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!savedPreferences) return;

    try {
      const parsed = JSON.parse(savedPreferences) as Partial<SchedulePreferences>;
      setPreferences(prev => ({ ...prev, ...parsed }));
    } catch {
      window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const classesWithCourseAndInstructor = useMemo(
    () => classData?.filter(cls => cls?.default_instructor_uuid === instructor?.uuid) || [],
    [classData, instructor?.uuid]
  );

  const bookingsQuery = useQuery({
    ...getInstructorBookingsOptions({
      path: { instructorUuid: instructor?.uuid ?? '' },
      query: { pageable: { page: 0, size: 50 }, status: '' },
    }),
    enabled: !!instructor?.uuid,
  });

  const bookingRequests = useMemo(
    () =>
      (bookingsQuery.data?.data?.content ?? []).filter(
        booking =>
          REQUEST_STATUSES.includes(booking.status) &&
          booking.start_time &&
          new Date(booking.start_time).getTime() >= Date.now()
      ),
    [bookingsQuery.data]
  );

  const bookingStudentQueries = useQueries({
    queries: bookingRequests.map(booking => ({
      ...getStudentByIdOptions({ path: { uuid: booking.student_uuid } }),
      enabled: !!booking.student_uuid,
    })),
  });

  const bookingStudentsById = useMemo(() => {
    const map: Record<string, string> = {};
    bookingStudentQueries.forEach(queryResult => {
      const student = queryResult.data;
      if (student?.uuid) {
        map[student.uuid] = student.full_name || student.email || 'Student';
      }
    });
    return map;
  }, [bookingStudentQueries]);

  const classEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = [];

    classesWithCourseAndInstructor.forEach((classDef: ClassDefinition, classIndex: number) => {
      const color = COLOR_PALETTE[classIndex % COLOR_PALETTE.length];
      classDef.schedule?.forEach((scheduleItem: ClassSchedule) => {
        events.push({
          classDefinitionId: classDef.uuid,
          color,
          courseName: classDef.course?.name || '',
          eventType: 'class',
          id: scheduleItem.uuid,
          instructor: classDef.instructor?.full_name || '',
          location: classDef.location_name || '',
          locationType: classDef.location_type || '',
          maxParticipants: classDef.max_participants || 0,
          requestSourceType: 'system',
          sessionFormat: classDef.session_format || '',
          startTime: new Date(scheduleItem.start_time),
          endTime: new Date(scheduleItem.end_time),
          title: classDef.title,
          trainingFee: classDef.training_fee || 0,
        });
      });
    });

    return events;
  }, [classesWithCourseAndInstructor]);

  const bookingRequestEvents = useMemo<CalendarEvent[]>(
    () =>
      bookingRequests.map((booking: BookingResponse) => {
        const location = booking.purpose || 'Venue or classroom to be confirmed';
        const locationType = isClassroomLocation(location)
          ? 'classroom'
          : isVenueLocation(location)
            ? 'venue'
            : 'request';

        return {
          classDefinitionId: booking.course_uuid || booking.uuid,
          color: 'rgb(245 158 11)',
          courseName: booking.course_uuid ? `Course ${booking.course_uuid.slice(0, 8)}` : 'Booking',
          eventType: 'booking_request',
          id: booking.uuid,
          instructor: instructor?.full_name || '',
          location,
          locationType,
          maxParticipants: 1,
          requestNote: booking.purpose || 'Booking request awaiting instructor confirmation.',
          requestSource: locationType === 'classroom' ? 'Classroom request' : 'Venue request',
          requestSourceType:
            locationType === 'classroom'
              ? 'classroom'
              : locationType === 'venue'
                ? 'venue'
                : 'student',
          requestStatus: booking.status,
          sessionFormat: 'Request',
          startTime: new Date(booking.start_time),
          endTime: new Date(booking.end_time),
          studentName: bookingStudentsById[booking.student_uuid] || 'Student request',
          title: bookingStudentsById[booking.student_uuid] || 'Booking request',
          trainingFee: booking.price_amount || 0,
        };
      }),
    [bookingRequests, bookingStudentsById, instructor?.full_name]
  );

  const allEvents = useMemo(
    () =>
      [...classEvents, ...bookingRequestEvents].sort(
        (left, right) => left.startTime.getTime() - right.startTime.getTime()
      ),
    [bookingRequestEvents, classEvents]
  );

  const uniqueClasses = useMemo(() => {
    const items = classesWithCourseAndInstructor.map((classDef: ClassDefinition) => ({
      id: classDef.uuid,
      name: `${classDef.title} - ${classDef.course?.name || 'Unknown course'}`,
    }));

    const query = searchQuery.toLowerCase();
    return items.filter(item => !query || item.name.toLowerCase().includes(query));
  }, [classesWithCourseAndInstructor, searchQuery]);

  const bookingFilterItems = useMemo(() => {
    const baseItem = {
      id: 'booking-requests',
      name: `Booking Requests (${bookingRequestEvents.length})`,
    };

    if (!searchQuery) return bookingRequestEvents.length > 0 ? [baseItem] : [];
    return baseItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ? [baseItem] : [];
  }, [bookingRequestEvents.length, searchQuery]);

  const venueFilterItems = useMemo(() => {
    const items = Array.from(
      new Set(
        allEvents
          .filter(event => isVenueLocation(event.location))
          .map(event => event.location)
          .filter(Boolean)
      )
    ).map(location => ({ id: location, name: location }));

    const query = searchQuery.toLowerCase();
    return items.filter(item => !query || item.name.toLowerCase().includes(query));
  }, [allEvents, searchQuery]);

  const classroomFilterItems = useMemo(() => {
    const items = Array.from(
      new Set(
        allEvents
          .filter(event => isClassroomLocation(event.location))
          .map(event => event.location)
          .filter(Boolean)
      )
    ).map(location => ({ id: location, name: location }));

    const query = searchQuery.toLowerCase();
    return items.filter(item => !query || item.name.toLowerCase().includes(query));
  }, [allEvents, searchQuery]);

  const filteredEvents = useMemo(() => {
    switch (selectedFilter.kind) {
      case 'class':
        return allEvents.filter(event => event.classDefinitionId === selectedFilter.id);
      case 'booking':
        return bookingRequestEvents;
      case 'venue':
      case 'classroom':
        return allEvents.filter(event => event.location === selectedFilter.id);
      default:
        return allEvents;
    }
  }, [allEvents, bookingRequestEvents, selectedFilter]);

  const activeFilterCount = Number(selectedFilter.kind !== 'all');
  const selectedFilterKey =
    selectedFilter.kind === 'all' ? 'all' : `${selectedFilter.kind}:${selectedFilter.id}`;

  useEffect(() => {
    if (activeFilterCount === 0 || filteredEvents.length === 0) {
      lastAutoFocusKeyRef.current = null;
      return;
    }

    if (lastAutoFocusKeyRef.current === selectedFilterKey) return;

    const nextDate = new Date(filteredEvents[0].startTime);
    lastAutoFocusKeyRef.current = selectedFilterKey;
    setCurrentDate(previous => (previous.getTime() === nextDate.getTime() ? previous : nextDate));
  }, [activeFilterCount, filteredEvents, selectedFilterKey]);

  useEffect(() => {
    if (!isCompactLayout) {
      setIsDetailsSheetOpen(false);
      setIsFiltersSheetOpen(false);
    }
  }, [isCompactLayout]);

  const filterSections = useMemo<ScheduleFilterSection[]>(
    () => [
      {
        count: bookingFilterItems.length,
        isOpen: openDropdowns.bookings,
        items: bookingFilterItems,
        key: 'bookings',
        label: 'Booking Requests',
        onItemClick: id => {
          setSelectedFilter({ id, kind: 'booking' });
          setIsFiltersSheetOpen(false);
        },
        onToggle: () => setOpenDropdowns(prev => ({ ...prev, bookings: !prev.bookings })),
        selectedId: selectedFilter.kind === 'booking' ? selectedFilter.id : null,
      },
      {
        count: uniqueClasses.length,
        isOpen: openDropdowns.classes,
        items: uniqueClasses,
        key: 'classes',
        label: 'Classes',
        onItemClick: id => {
          setSelectedFilter({ id, kind: 'class' });
          setIsFiltersSheetOpen(false);
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
          setIsFiltersSheetOpen(false);
        },
        onToggle: () => setOpenDropdowns(prev => ({ ...prev, venues: !prev.venues })),
        selectedId: selectedFilter.kind === 'venue' ? selectedFilter.id : null,
      },
      {
        count: classroomFilterItems.length,
        isOpen: openDropdowns.classrooms,
        items: classroomFilterItems,
        key: 'classrooms',
        label: 'Classrooms / Rooms',
        onItemClick: id => {
          setSelectedFilter({ id, kind: 'classroom' });
          setIsFiltersSheetOpen(false);
        },
        onToggle: () => setOpenDropdowns(prev => ({ ...prev, classrooms: !prev.classrooms })),
        selectedId: selectedFilter.kind === 'classroom' ? selectedFilter.id : null,
      },
    ],
    [
      bookingFilterItems,
      classroomFilterItems,
      openDropdowns.bookings,
      openDropdowns.classes,
      openDropdowns.classrooms,
      openDropdowns.venues,
      selectedFilter,
      uniqueClasses,
      venueFilterItems,
    ]
  );

  const handleDateChange = (direction: 'next' | 'prev') => {
    const nextDate = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        nextDate.setDate(nextDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        nextDate.setDate(nextDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        nextDate.setMonth(nextDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'year':
        nextDate.setFullYear(nextDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }

    setCurrentDate(nextDate);
  };

  const handleMonthClick = (monthIndex: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
    setViewMode('month');
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
  };

  const handleEventSelect = (event: CalendarEvent) => {
    setSelectedEvent(event);
    if (isCompactLayout) setIsDetailsSheetOpen(true);
  };

  const handleSlotCreate = (slot: { endTime: Date; startTime: Date }) => {
    setPendingSlot(slot);
    setIsCreateSheetOpen(true);
  };

  const { data } = useQuery({
    ...getEnrollmentsForInstanceOptions({
      path: { instanceUuid: selectedEvent?.eventType === 'booking_request' ? '' : selectedEvent?.id || '' },
    }),
    enabled: !!selectedEvent?.id && selectedEvent?.eventType !== 'booking_request',
  });

  const enrollmentsData = data?.data || [];
  const studentUuids = enrollmentsData.map(enrollment => enrollment?.student_uuid).filter(Boolean);
  const { studentsMap, isLoading: isLoadingStudents } = useStudentsMap(studentUuids);

  const transformedStudents: StudentEnrollment[] = useMemo(
    () =>
      enrollmentsData.map(enrollment => {
        const student = studentsMap[enrollment.student_uuid || ''];
        let attendanceStatus: 'absent' | 'pending' | 'present' = 'pending';

        if (enrollment.is_attendance_marked) {
          attendanceStatus = enrollment.did_attend ? 'present' : 'absent';
        }

        return {
          attendanceStatus,
          enrollmentDate: new Date(
            enrollment.created_date || selectedEvent?.startTime || new Date()
          ),
          id: enrollment.uuid || '',
          name: student?.full_name || 'Unknown Student',
        };
      }),
    [enrollmentsData, selectedEvent?.startTime, studentsMap]
  );

  const acceptBooking = useMutation(acceptBookingMutation());
  const declineBooking = useMutation(declineBookingMutation());

  const handleBookingAction = (action: 'accept' | 'decline') => {
    if (!selectedEvent || selectedEvent.eventType !== 'booking_request') return;

    const mutation = action === 'accept' ? acceptBooking : declineBooking;
    mutation.mutate(
      { path: { bookingUuid: selectedEvent.id } },
      {
        onError: error => {
          toast.error(error instanceof Error ? error.message : `Failed to ${action} booking request`);
        },
        onSuccess: () => {
          toast.success(`Booking request ${action === 'accept' ? 'accepted' : 'declined'}`);
          bookingsQuery.refetch();
          setSelectedEvent(null);
        },
      }
    );
  };

  const workingHoursLabel = `${preferences.workingHoursStart} - ${preferences.workingHoursEnd}`;

  const requestSummary = useMemo(() => {
    const selectedDateKey = formatDateKey(currentDate);
    return bookingRequestEvents.filter(event => formatDateKey(event.startTime) === selectedDateKey)
      .length;
  }, [bookingRequestEvents, currentDate]);

  return (
    <main>
      <div className='flex flex-col space-y-3 py-6'>
        <Badge
          variant='outline'
          className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
        >
          Class management
        </Badge>

        <p className='text-muted-foreground max-w-3xl text-sm leading-relaxed'>
          Manage instructor sessions, booking requests, locations, and calendar settings from one
          scheduling workspace.
        </p>
      </div>

      <div className='mb-4 flex w-full justify-end'>
        <Button
          onClick={() => {
            const startTime = new Date();
            startTime.setHours(Number(preferences.workingHoursStart.slice(0, 2)), 0, 0, 0);
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + Number(preferences.defaultClassDuration));
            handleSlotCreate({ endTime, startTime });
          }}
          size='lg'
          className='gap-2'
        >
          <PlusIcon className='h-5 w-5' />
          Create New Class
        </Button>
      </div>

      {isPending ? (
        <Card className='bg-background flex h-[calc(75vh-4rem)] flex-col overflow-hidden rounded-2xl border font-sans'>
          <div className='bg-background border-border border-b px-4 py-3 md:px-6 md:py-4'>
            <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center md:gap-6'>
                <Skeleton className='h-6 w-32' />
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-8 w-8 rounded-lg' />
                  <Skeleton className='h-5 w-40' />
                  <Skeleton className='h-8 w-8 rounded-lg' />
                </div>
                <Skeleton className='h-9 w-64 rounded-lg' />
              </div>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-8 w-24 rounded-lg' />
                <Skeleton className='h-8 w-8 rounded-lg' />
              </div>
            </div>
          </div>
          <ScheduleLoadingState />
        </Card>
      ) : (
        <Card className='bg-background flex h-[calc(75vh-2rem)] flex-col overflow-hidden pt-0 font-sans sm:h-[calc(82vh-2rem)] md:h-[calc(80vh-2rem)]'>
          <style jsx global>{`
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          <ScheduleCalendarHeader
            currentDate={currentDate}
            eventCount={filteredEvents.length}
            onDateChange={handleDateChange}
            onSettingsClick={() => setIsSettingsSheetOpen(true)}
            onViewChange={setViewMode}
            onWorkingHoursClick={() => setIsSettingsSheetOpen(true)}
            viewMode={viewMode}
            workingHoursLabel={workingHoursLabel}
          />

          <div className='border-border bg-muted/20 flex items-center justify-between gap-3 border-b px-4 py-2 text-xs md:px-6 md:text-sm'>
            <div className='text-muted-foreground flex flex-wrap items-center gap-3'>
              <span>
                Timezone: <span className='text-foreground font-medium'>{preferences.timezone}</span>
              </span>
              <span>
                Location: <span className='text-foreground font-medium'>{preferences.location}</span>
              </span>
              <span>
                Default duration:{' '}
                <span className='text-foreground font-medium'>
                  {preferences.defaultClassDuration} min
                </span>
              </span>
            </div>
            <div className='flex items-center gap-2'>
              {preferences.showWeekends && (
                <Badge variant='secondary' className='text-[10px] md:text-xs'>
                  Weekends on
                </Badge>
              )}
              {preferences.showHolidays && (
                <Badge variant='secondary' className='text-[10px] md:text-xs'>
                  Holidays on
                </Badge>
              )}
              {requestSummary > 0 && (
                <Badge className='bg-warning/15 text-warning text-[10px] md:text-xs'>
                  {requestSummary} request{requestSummary === 1 ? '' : 's'} today
                </Badge>
              )}
            </div>
          </div>

          <div className='relative flex flex-1 overflow-hidden'>
            <ScheduleCompactActions
              activeFilterCount={activeFilterCount}
              hasSelectedEvent={!!selectedEvent}
              onOpenDetails={() => setIsDetailsSheetOpen(true)}
              onOpenFilters={() => setIsFiltersSheetOpen(true)}
            />

            <div className='bg-background border-border hidden w-60 flex-col overflow-hidden border-r min-[1551px]:flex md:w-64'>
              <ScheduleFiltersPanel
                activeFilterCount={activeFilterCount}
                onClearFilters={() => setSelectedFilter({ id: 'all', kind: 'all' })}
                onSearchChange={setSearchQuery}
                searchQuery={searchQuery}
                sections={filterSections}
              />
            </div>

            <div className='bg-background flex flex-1 flex-col overflow-hidden pt-14 min-[1551px]:pt-2'>
              {viewMode === 'week' && (
                <ScheduleWeekView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onDateSelect={handleDateSelect}
                  onEventSelect={handleEventSelect}
                  onTimeSlotSelect={handleSlotCreate}
                  selectedEvent={selectedEvent}
                  showWeekends={preferences.showWeekends}
                />
              )}
              {viewMode === 'day' && (
                <ScheduleDayView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onEventSelect={handleEventSelect}
                  onTimeSlotSelect={handleSlotCreate}
                  selectedEvent={selectedEvent}
                />
              )}
              {viewMode === 'month' && (
                <ScheduleMonthView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onDateSelect={handleDateSelect}
                  onEventSelect={handleEventSelect}
                  showWeekends={preferences.showWeekends}
                />
              )}
              {viewMode === 'year' && (
                <ScheduleYearView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onMonthClick={handleMonthClick}
                />
              )}
            </div>

            <div className='bg-muted/30 border-border scrollbar-hide hidden overflow-y-auto border-l min-[1551px]:block min-[1551px]:w-80'>
              <ScheduleSessionDetailsPanel
                isLoadingStudents={isLoadingStudents}
                isUpdatingRequest={acceptBooking.isPending || declineBooking.isPending}
                onAcceptRequest={() => handleBookingAction('accept')}
                onDeclineRequest={() => handleBookingAction('decline')}
                selectedEvent={selectedEvent}
                transformedStudents={transformedStudents}
              />
            </div>
          </div>

          <Sheet open={isFiltersSheetOpen} onOpenChange={setIsFiltersSheetOpen}>
            <SheetContent side='left' className='w-[92vw] max-w-sm p-0'>
              <SheetHeader className='border-border border-b'>
                <SheetTitle>Schedule filters</SheetTitle>
                <SheetDescription>
                  Switch between classes, booking requests, venues, and classrooms.
                </SheetDescription>
              </SheetHeader>
              <ScheduleFiltersPanel
                activeFilterCount={activeFilterCount}
                onClearFilters={() => setSelectedFilter({ id: 'all', kind: 'all' })}
                onSearchChange={setSearchQuery}
                searchQuery={searchQuery}
                sections={filterSections}
              />
            </SheetContent>
          </Sheet>

          <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
            <SheetContent side='right' className='w-[92vw] max-w-lg overflow-y-auto p-0'>
              <SheetHeader className='border-border border-b'>
                <SheetTitle>Session details</SheetTitle>
                <SheetDescription>
                  Review session timing, requests, and roster details.
                </SheetDescription>
              </SheetHeader>
              <ScheduleSessionDetailsPanel
                isLoadingStudents={isLoadingStudents}
                isUpdatingRequest={acceptBooking.isPending || declineBooking.isPending}
                onAcceptRequest={() => handleBookingAction('accept')}
                onDeclineRequest={() => handleBookingAction('decline')}
                selectedEvent={selectedEvent}
                transformedStudents={transformedStudents}
              />
            </SheetContent>
          </Sheet>

          <Sheet open={isSettingsSheetOpen} onOpenChange={setIsSettingsSheetOpen}>
            <SheetContent side='right' className='w-full sm:min-w-2xl max-w-4xl overflow-y-auto px-3'>
              <SheetHeader className='border-border border-b px-0'>
                <SheetTitle>Calendar settings</SheetTitle>
                <SheetDescription>
                  Adjust view appearance, schedule visibility, timezone, working hours, and class
                  defaults.
                </SheetDescription>
              </SheetHeader>

              <div className='space-y-6 px-1 pb-6'>
                <section className='space-y-4'>
                  <div>
                    <h3 className='text-sm font-semibold'>View and appearance</h3>
                    <p className='text-muted-foreground text-sm'>
                      Control event colors and the class theme used across the schedule.
                    </p>
                  </div>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='event-color-mode'>Event colors</Label>
                      <Select
                        value={preferences.eventColorMode}
                        onValueChange={value =>
                          setPreferences(prev => ({ ...prev, eventColorMode: value }))
                        }
                      >
                        <SelectTrigger id='event-color-mode' className='w-full'>
                          <SelectValue placeholder='Choose color mode' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='class'>By class</SelectItem>
                          <SelectItem value='theme'>Use class theme</SelectItem>
                          <SelectItem value='request'>Highlight requests</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='class-theme'>Class theme</Label>
                      <Select
                        value={preferences.classTheme}
                        onValueChange={value =>
                          setPreferences(prev => ({ ...prev, classTheme: value }))
                        }
                      >
                        <SelectTrigger id='class-theme' className='w-full'>
                          <SelectValue placeholder='Select theme' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='Ocean'>Ocean</SelectItem>
                          <SelectItem value='Sunrise'>Sunrise</SelectItem>
                          <SelectItem value='Forest'>Forest</SelectItem>
                          <SelectItem value='Slate'>Slate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <section className='space-y-4'>
                  <div>
                    <h3 className='text-sm font-semibold'>Visibility</h3>
                    <p className='text-muted-foreground text-sm'>
                      Choose whether weekends and holiday indicators should appear in your calendar.
                    </p>
                  </div>
                  <div className='grid gap-4'>
                    <div className='flex items-center justify-between rounded-xl border p-4'>
                      <div>
                        <p className='font-medium'>Show weekends</p>
                        <p className='text-muted-foreground text-sm'>
                          Keep Saturday and Sunday visible in the week view.
                        </p>
                      </div>
                      <Switch
                        checked={preferences.showWeekends}
                        onCheckedChange={checked =>
                          setPreferences(prev => ({ ...prev, showWeekends: checked }))
                        }
                      />
                    </div>
                    <div className='flex items-center justify-between rounded-xl border p-4'>
                      <div>
                        <p className='font-medium'>Show holidays</p>
                        <p className='text-muted-foreground text-sm'>
                          Reserve space for public holiday indicators in the calendar header.
                        </p>
                      </div>
                      <Switch
                        checked={preferences.showHolidays}
                        onCheckedChange={checked =>
                          setPreferences(prev => ({ ...prev, showHolidays: checked }))
                        }
                      />
                    </div>
                  </div>
                </section>

                <section className='space-y-4'>
                  <div>
                    <h3 className='text-sm font-semibold'>Timezone, location, and working hours</h3>
                    <p className='text-muted-foreground text-sm'>
                      Define where you teach and the hours available for new classes.
                    </p>
                  </div>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='schedule-timezone'>Timezone</Label>
                      <Select
                        value={preferences.timezone}
                        onValueChange={value =>
                          setPreferences(prev => ({ ...prev, timezone: value }))
                        }
                      >
                        <SelectTrigger id='schedule-timezone' className='w-full'>
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
                      <Label htmlFor='schedule-location'>Location</Label>
                      <Input
                        id='schedule-location'
                        value={preferences.location}
                        onChange={event =>
                          setPreferences(prev => ({ ...prev, location: event.target.value }))
                        }
                        placeholder='Campus, city, or venue'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='working-hours-start'>Working hours start</Label>
                      <Select
                        value={preferences.workingHoursStart}
                        onValueChange={value =>
                          setPreferences(prev => ({ ...prev, workingHoursStart: value }))
                        }
                      >
                        <SelectTrigger id='working-hours-start' className='w-full'>
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
                      <Label htmlFor='working-hours-end'>Working hours end</Label>
                      <Select
                        value={preferences.workingHoursEnd}
                        onValueChange={value =>
                          setPreferences(prev => ({ ...prev, workingHoursEnd: value }))
                        }
                      >
                        <SelectTrigger id='working-hours-end' className='w-full'>
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
                  </div>
                </section>

                <section className='space-y-4'>
                  <div>
                    <h3 className='text-sm font-semibold'>Class defaults</h3>
                    <p className='text-muted-foreground text-sm'>
                      Apply a default duration when you create a class from an empty slot.
                    </p>
                  </div>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='default-duration'>Default class duration</Label>
                      <Select
                        value={preferences.defaultClassDuration}
                        onValueChange={value =>
                          setPreferences(prev => ({ ...prev, defaultClassDuration: value }))
                        }
                      >
                        <SelectTrigger id='default-duration' className='w-full'>
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
                    <div className='rounded-xl border p-4'>
                      <p className='text-sm font-medium'>Current booking visibility</p>
                      <p className='text-muted-foreground mt-1 text-sm'>
                        {bookingRequestEvents.length} pending request
                        {bookingRequestEvents.length === 1 ? '' : 's'} on the schedule, with request
                        cards highlighted in amber.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
            <SheetContent side='right' className='w-full sm:min-w-2xl lg:min-w-5xl max-w-6xl overflow-y-auto px-3'>
              <SheetHeader className='border-border border-b px-0'>
                <SheetTitle>Create class from calendar slot</SheetTitle>
                <SheetDescription>
                  Start from the selected time block and finish the rest of the class setup without
                  leaving the schedule.
                </SheetDescription>
              </SheetHeader>
              <ClassBuilderPage
                embedded
                initialSlot={pendingSlot}
                onCancel={() => setIsCreateSheetOpen(false)}
                onSuccess={() => {
                  setIsCreateSheetOpen(false);
                  setPendingSlot(null);
                }}
              />
            </SheetContent>
          </Sheet>
        </Card>
      )}
    </main>
  );
}
