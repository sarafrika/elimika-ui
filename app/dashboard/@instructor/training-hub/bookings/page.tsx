'use client';

import ConfirmModal from '@/components/custom-modals/confirm-modal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as DateCalendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import {
  cx,
  elimikaDesignSystem,
  getEmptyStateClasses,
  getHeaderClasses,
  getStatCardClasses,
} from '@/lib/design-system';
import {
  acceptBookingMutation,
  declineBookingMutation,
  getCourseByUuidOptions,
  getInstructorBookingsOptions,
  getInstructorBookingsQueryKey,
  getStudentByIdOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { BookingResponse, GetStudentByIdResponse, StatusEnum9 } from '@/services/client/types.gen';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  FilterIcon,
  GraduationCap,
  Layers3,
  Search,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BookingDetailsModal } from '../../../_components/booking-details-modal';
import { getStatusColor } from '../../../_components/manage-bookings';

type BookingTab = 'requests' | 'upcoming' | 'history';

const PAGE_SIZE = 15;
const ALL_STATUS = 'all';
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_OPTIONS: Array<{ value: typeof ALL_STATUS | StatusEnum9; label: string }> = [
  { value: ALL_STATUS, label: 'All statuses' },
  { value: 'payment_required', label: 'Payment required' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'accepted_confirmed', label: 'Accepted + confirmed' },
  { value: 'payment_failed', label: 'Payment failed' },
  { value: 'expired', label: 'Expired' },
  { value: 'declined', label: 'Declined' },
  { value: 'cancelled', label: 'Cancelled' },
];

const TERMINAL_STATUSES: StatusEnum9[] = [
  'confirmed',
  'accepted_confirmed',
  'cancelled',
  'declined',
  'expired',
];

const REQUEST_STATUSES: StatusEnum9[] = ['payment_required', 'accepted', 'payment_failed'];

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const getDayKey = (date: Date) => date.toISOString().slice(0, 10);

const formatDate = (date?: Date) =>
  date
    ? date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : 'No date';

const formatDateTime = (date?: Date) =>
  date
    ? date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'No date';

const formatTimeRange = (start?: Date, end?: Date) => {
  if (!start || !end) return 'Time not available';

  return `${start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })} - ${end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const getDurationLabel = (start?: Date, end?: Date) => {
  if (!start || !end) return 'Unknown duration';

  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (remainingMinutes === 0) return `${hours} hr`;
  return `${hours} hr ${remainingMinutes} min`;
};

const getScheduleCategory = (booking: BookingResponse, now: Date) => {
  const isPast = booking.start_time < now || TERMINAL_STATUSES.includes(booking.status);
  const isUpcoming =
    booking.start_time >= now && !['cancelled', 'declined', 'expired'].includes(booking.status);
  const isRequest = REQUEST_STATUSES.includes(booking.status) && booking.start_time >= now;

  return {
    isPast,
    isUpcoming,
    isRequest,
  };
};

const canAcceptBooking = (status: StatusEnum9) =>
  !['accepted', 'confirmed', 'accepted_confirmed', 'cancelled', 'declined', 'expired'].includes(
    status
  );

const canDeclineBooking = (status: StatusEnum9) =>
  !['confirmed', 'accepted_confirmed', 'cancelled', 'declined', 'expired'].includes(status);

function BookingsPage() {
  const instructor = useInstructor();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<BookingTab>('requests');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<typeof ALL_STATUS | StatusEnum9>(ALL_STATUS);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<BookingResponse | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [openAcceptModal, setOpenAcceptModal] = useState(false);
  const [openDeclineModal, setOpenDeclineModal] = useState(false);

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'training-hub', title: 'Training Hub', url: '/dashboard/training-hub' },
      {
        id: 'bookings',
        title: 'Bookings',
        url: '/dashboard/training-hub/bookings',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const bookingsQuery = useQuery({
    ...getInstructorBookingsOptions({
      path: { instructorUuid: instructor?.uuid ?? '' },
      query: {
        status: statusFilter === ALL_STATUS ? '' : statusFilter,
        pageable: { page: Math.max(0, page - 1), size: PAGE_SIZE },
      },
    }),
    enabled: !!instructor?.uuid,
  });

  const acceptBooking = useMutation(acceptBookingMutation());
  const declineBooking = useMutation(declineBookingMutation());

  const bookings = useMemo<BookingResponse[]>(
    () => bookingsQuery.data?.data?.content ?? [],
    [bookingsQuery.data]
  );
  const now = useMemo(() => new Date(), [bookings]);

  const studentUuids = useMemo(
    () => Array.from(new Set(bookings.map(booking => booking.student_uuid).filter(Boolean))),
    [bookings]
  );

  const studentQueries = useQueries({
    queries: studentUuids.map(uuid => ({
      ...getStudentByIdOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });

  const studentsById = useMemo(() => {
    const map: Record<string, GetStudentByIdResponse> = {};
    studentQueries.forEach(queryResult => {
      const student = queryResult.data;
      if (student?.uuid) {
        map[student.uuid] = student;
      }
    });
    return map;
  }, [studentQueries]);

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: selected?.course_uuid ?? '' } }),
    enabled: !!selected?.course_uuid,
  });

  const searchedBookings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return bookings.filter(booking => {
      if (!normalizedQuery) return true;

      const student = studentsById[booking.student_uuid];

      return [
        booking.uuid,
        booking.student_uuid,
        booking.course_uuid,
        booking.purpose,
        student?.full_name,
        student?.email,
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [bookings, query, studentsById]);

  const requests = useMemo(
    () => searchedBookings.filter(booking => getScheduleCategory(booking, now).isRequest),
    [now, searchedBookings]
  );

  const upcoming = useMemo(
    () => searchedBookings.filter(booking => getScheduleCategory(booking, now).isUpcoming),
    [now, searchedBookings]
  );

  const history = useMemo(
    () => searchedBookings.filter(booking => getScheduleCategory(booking, now).isPast),
    [now, searchedBookings]
  );

  const visibleBookings = useMemo(() => {
    switch (activeTab) {
      case 'requests':
        return requests;
      case 'upcoming':
        return upcoming;
      case 'history':
        return history;
      default:
        return searchedBookings;
    }
  }, [activeTab, history, requests, searchedBookings, upcoming]);

  useEffect(() => {
    if (visibleBookings.length === 0) {
      setSelected(null);
      return;
    }

    const selectedStillVisible =
      selected && visibleBookings.some(booking => booking.uuid === selected.uuid);
    if (!selectedStillVisible) {
      setSelected(visibleBookings[0]);
    }
  }, [selected, visibleBookings]);

  useEffect(() => {
    if (!selected) return;
    setCalendarDate(selected.start_time);
    setCalendarMonth(selected.start_time);
  }, [selected]);

  const dayCounts = useMemo(() => {
    const counts = new Map<string, number>();
    upcoming.forEach(booking => {
      const key = getDayKey(booking.start_time);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [upcoming]);

  const selectedDayBookings = useMemo(
    () =>
      upcoming
        .filter(booking => isSameDay(booking.start_time, calendarDate))
        .sort((left, right) => left.start_time.getTime() - right.start_time.getTime()),
    [calendarDate, upcoming]
  );

  const calendarMonthStats = useMemo(() => {
    const month = calendarMonth.getMonth();
    const year = calendarMonth.getFullYear();
    const monthBookings = upcoming.filter(booking => {
      const date = booking.start_time;
      return date.getMonth() === month && date.getFullYear() === year;
    });

    const activeDays = new Set(monthBookings.map(booking => getDayKey(booking.start_time))).size;

    return {
      totalBookings: monthBookings.length,
      activeDays,
    };
  }, [calendarMonth, upcoming]);

  const busiestDays = useMemo(
    () =>
      Array.from(dayCounts.entries())
        .map(([day, count]) => ({ day, count }))
        .sort((left, right) => right.count - left.count)
        .slice(0, 3),
    [dayCounts]
  );

  const weekdaySpread = useMemo(() => {
    const counts = Array.from({ length: 7 }, () => 0);
    upcoming.forEach(booking => {
      counts[booking.start_time.getDay()] += 1;
    });
    return counts;
  }, [upcoming]);

  const timeBuckets = useMemo(() => {
    const buckets = {
      morning: 0,
      afternoon: 0,
      evening: 0,
    };

    upcoming.forEach(booking => {
      const hour = booking.start_time.getHours();
      if (hour < 12) {
        buckets.morning += 1;
      } else if (hour < 17) {
        buckets.afternoon += 1;
      } else {
        buckets.evening += 1;
      }
    });

    return buckets;
  }, [upcoming]);

  const stats = useMemo(() => {
    const confirmed = bookings.filter(booking =>
      ['confirmed', 'accepted_confirmed'].includes(booking.status)
    ).length;
    const requiresAttention = bookings.filter(booking =>
      ['payment_required', 'accepted', 'payment_failed'].includes(booking.status)
    ).length;
    const totalHours = upcoming.reduce((sum, booking) => {
      const duration = booking.end_time.getTime() - booking.start_time.getTime();
      return sum + duration / 3600000;
    }, 0);
    const thisWeek = upcoming.filter(booking => {
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      return booking.start_time >= startOfWeek && booking.start_time < endOfWeek;
    }).length;

    return {
      total: bookings.length,
      confirmed,
      requiresAttention,
      totalHours,
      thisWeek,
    };
  }, [bookings, now, upcoming]);

  const totalPages =
    bookingsQuery.data?.data?.metadata?.totalPages ??
    (bookings.length ? Math.ceil(bookings.length / PAGE_SIZE) : 1);

  const handlePrev = () => setPage(current => Math.max(1, current - 1));
  const handleNext = () => setPage(current => Math.min(totalPages, current + 1));

  const invalidateBookings = () => {
    qc.invalidateQueries({
      queryKey: getInstructorBookingsQueryKey({
        path: { instructorUuid: instructor?.uuid ?? '' },
        query: {
          status: statusFilter === ALL_STATUS ? '' : statusFilter,
          pageable: { page: Math.max(0, page - 1), size: PAGE_SIZE },
        },
      }),
    });
  };

  const handleAcceptBooking = () => {
    if (!selected) return;

    acceptBooking.mutate(
      { path: { bookingUuid: selected.uuid } },
      {
        onSuccess: response => {
          invalidateBookings();
          toast.success(response?.message || 'Booking accepted');
          setOpenAcceptModal(false);
        },
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error, 'Failed to accept booking'));
        },
      }
    );
  };

  const handleDeclineBooking = () => {
    if (!selected) return;

    declineBooking.mutate(
      { path: { bookingUuid: selected.uuid } },
      {
        onSuccess: response => {
          invalidateBookings();
          toast.success(response?.message || 'Booking declined');
          setOpenDeclineModal(false);
        },
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error, 'Failed to decline booking'));
        },
      }
    );
  };

  const renderList = (items: BookingResponse[], emptyTitle: string, emptyDescription: string) => {
    if (bookingsQuery.isLoading) {
      return (
        <div className={getEmptyStateClasses()}>
          <Clock3 className={elimikaDesignSystem.components.emptyState.icon} />
          <div className={elimikaDesignSystem.components.emptyState.title}>Loading bookings</div>
          <p className={elimikaDesignSystem.components.emptyState.description}>
            Booking requests and schedules are being loaded for this instructor.
          </p>
        </div>
      );
    }

    if (bookingsQuery.isError) {
      return (
        <div className={getEmptyStateClasses()}>
          <CircleAlert className={elimikaDesignSystem.components.emptyState.icon} />
          <div className={elimikaDesignSystem.components.emptyState.title}>
            Could not load bookings
          </div>
          <p className={elimikaDesignSystem.components.emptyState.description}>
            Refresh the page or check the query parameters for this booking view.
          </p>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className={getEmptyStateClasses()}>
          <CalendarDays className={elimikaDesignSystem.components.emptyState.icon} />
          <div className={elimikaDesignSystem.components.emptyState.title}>{emptyTitle}</div>
          <p className={elimikaDesignSystem.components.emptyState.description}>
            {emptyDescription}
          </p>
        </div>
      );
    }

    return (
      <div className='space-y-3'>
        {items.map(booking => {
          const student = studentsById[booking.student_uuid];
          const isActive = selected?.uuid === booking.uuid;

          return (
            <button
              key={booking.uuid}
              type='button'
              onClick={() => setSelected(booking)}
              className={cx(
                'w-full rounded-3xl border p-4 text-left transition',
                isActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/30 hover:bg-muted/40'
              )}
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='space-y-1'>
                  <div className='text-foreground font-semibold'>
                    {student?.full_name ?? booking.student_uuid.slice(0, 8)}
                  </div>
                  <div className='text-muted-foreground text-sm'>
                    {booking.purpose ?? 'No purpose provided'}
                  </div>
                </div>

                <Badge className={cx('text-white capitalize', getStatusColor(booking.status))}>
                  {booking.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className='mt-4 grid gap-2 text-sm md:grid-cols-2'>
                <div className='text-muted-foreground'>{formatDate(booking.start_time)}</div>
                <div className='text-muted-foreground'>
                  {formatTimeRange(booking.start_time, booking.end_time)}
                </div>
                <div className='text-foreground font-medium'>
                  {booking.currency ?? 'KES'} {booking.price_amount ?? 0}
                </div>
                <div className='text-muted-foreground'>
                  Duration: {getDurationLabel(booking.start_time, booking.end_time)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <main className={elimikaDesignSystem.components.pageContainer}>
      <section className={cx(getHeaderClasses(), 'relative overflow-hidden')}>
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_40%),radial-gradient(circle_at_bottom_right,hsl(var(--primary)/0.12),transparent_35%)] dark:hidden' />
        <div className='relative space-y-6'>
          <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
            <div className='space-y-4'>
              <Badge className={elimikaDesignSystem.components.header.badge}>
                Instructor bookings
              </Badge>
              <div className='space-y-3'>
                <h1 className={elimikaDesignSystem.components.header.title}>
                  Manage requests and see how sessions spread across your calendar
                </h1>
                <p className={elimikaDesignSystem.components.header.subtitle}>
                  Review incoming training bookings, approve or decline requests, and monitor how
                  upcoming sessions are distributed across your working month.
                </p>
              </div>
            </div>

            <Card className='border-primary/20 bg-primary/5 w-full max-w-md rounded-[32px] shadow-none'>
              <CardContent className='space-y-3 p-6'>
                <div className='text-primary flex items-center gap-2'>
                  <TrendingUp className='h-4 w-4' />
                  <span className='text-sm font-semibold'>Current workload</span>
                </div>
                <p className='text-foreground text-2xl font-semibold'>
                  {stats.thisWeek} booking{stats.thisWeek === 1 ? '' : 's'} this week
                </p>
                <p className='text-muted-foreground text-sm'>
                  {stats.totalHours.toFixed(1)} scheduled hours are currently visible in the
                  upcoming queue.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                    <Layers3 className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>All bookings</p>
                    <p className='text-foreground text-2xl font-semibold'>{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                    <CircleAlert className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Needs attention</p>
                    <p className='text-foreground text-2xl font-semibold'>
                      {stats.requiresAttention}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                    <CheckCircle2 className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Confirmed</p>
                    <p className='text-foreground text-2xl font-semibold'>{stats.confirmed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                    <Clock3 className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Upcoming hours</p>
                    <p className='text-foreground text-2xl font-semibold'>
                      {stats.totalHours.toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className='grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]'>
        <Card className='border-border/60 rounded-[32px] shadow-sm'>
          <CardHeader className='space-y-3'>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle className='text-xl'>Booking spread across calendar</CardTitle>
                <p className='text-muted-foreground text-sm'>
                  Use the month view to spot clustered days before you accept more sessions.
                </p>
              </div>

              <div className='text-muted-foreground text-sm'>
                {calendarMonthStats.totalBookings} upcoming booking
                {calendarMonthStats.totalBookings === 1 ? '' : 's'} across{' '}
                {calendarMonthStats.activeDays} active day
                {calendarMonthStats.activeDays === 1 ? '' : 's'}
              </div>
            </div>
          </CardHeader>

          <CardContent className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]'>
            <div className='border-border/60 overflow-auto rounded-3xl border'>
              <DateCalendar
                mode='single'
                selected={calendarDate}
                onSelect={date => date && setCalendarDate(date)}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                modifiers={{
                  hasBookings: upcoming.map(booking => booking.start_time),
                  busyDay: Array.from(dayCounts.entries())
                    .filter(([, count]) => count > 1)
                    .map(([day]) => new Date(day)),
                }}
                modifiersClassNames={{
                  hasBookings: 'bg-primary/10 font-medium text-foreground',
                  busyDay: 'ring-1 ring-primary/40',
                }}
                className='w-full'
              />
            </div>

            <div className='space-y-4'>
              <div className='border-border/60 bg-muted/30 rounded-3xl border p-4'>
                <div className='text-sm font-semibold'>Legend</div>
                <div className='mt-3 space-y-2 text-sm'>
                  <div className='flex items-center gap-2'>
                    <span className='bg-primary/10 border-primary/20 h-3 w-3 rounded-full border' />
                    <span className='text-muted-foreground'>
                      Day with at least one upcoming booking
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='ring-primary/40 h-3 w-3 rounded-full ring-2' />
                    <span className='text-muted-foreground'>Day with multiple bookings</span>
                  </div>
                </div>
              </div>

              <div className='border-border/60 rounded-3xl border p-4'>
                <div className='text-sm font-semibold'>Busiest dates</div>
                <div className='mt-3 space-y-3'>
                  {busiestDays.length === 0 ? (
                    <p className='text-muted-foreground text-sm'>
                      No upcoming bookings are scheduled yet.
                    </p>
                  ) : (
                    busiestDays.map(entry => (
                      <div key={entry.day} className='flex items-center justify-between text-sm'>
                        <span className='text-muted-foreground'>
                          {formatDate(new Date(entry.day))}
                        </span>
                        <Badge variant='secondary'>
                          {entry.count} session{entry.count === 1 ? '' : 's'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className='border-border/60 rounded-3xl border p-4'>
                <div className='text-sm font-semibold'>Time-of-day load</div>
                <div className='mt-3 space-y-3 text-sm'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>Morning</span>
                    <span className='font-medium'>{timeBuckets.morning}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>Afternoon</span>
                    <span className='font-medium'>{timeBuckets.afternoon}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>Evening</span>
                    <span className='font-medium'>{timeBuckets.evening}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/60 rounded-[32px] shadow-sm'>
          <CardHeader>
            <CardTitle className='text-xl'>{formatDate(calendarDate)} agenda</CardTitle>
            <p className='text-muted-foreground text-sm'>
              Daily view of the sessions already occupying the selected date.
            </p>
          </CardHeader>

          <CardContent className='space-y-6'>
            <div className='space-y-3'>
              {selectedDayBookings.length === 0 ? (
                <div className='border-border rounded-3xl border border-dashed p-6 text-center'>
                  <p className='text-muted-foreground text-sm'>
                    No upcoming bookings on this date.
                  </p>
                </div>
              ) : (
                selectedDayBookings.map(booking => {
                  const student = studentsById[booking.student_uuid];
                  return (
                    <button
                      key={booking.uuid}
                      type='button'
                      onClick={() => setSelected(booking)}
                      className={cx(
                        'w-full rounded-3xl border p-4 text-left transition',
                        selected?.uuid === booking.uuid
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30 hover:bg-muted/40'
                      )}
                    >
                      <div className='flex items-center justify-between gap-3'>
                        <div>
                          <div className='font-semibold'>
                            {student?.full_name ?? booking.student_uuid.slice(0, 8)}
                          </div>
                          <div className='text-muted-foreground text-sm'>
                            {formatTimeRange(booking.start_time, booking.end_time)}
                          </div>
                        </div>
                        <Badge
                          className={cx('text-white capitalize', getStatusColor(booking.status))}
                        >
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <Separator />

            <div>
              <div className='mb-3 text-sm font-semibold'>Weekly distribution</div>
              <div className='space-y-3'>
                {weekdaySpread.map((count, index) => (
                  <div key={WEEKDAY_LABELS[index]} className='space-y-1'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>{WEEKDAY_LABELS[index]}</span>
                      <span className='font-medium'>{count}</span>
                    </div>
                    <div className='bg-muted h-2 rounded-full'>
                      <div
                        className='bg-primary h-2 rounded-full transition-all'
                        style={{
                          width: `${Math.max(
                            count === 0 ? 0 : 8,
                            bookings.length === 0
                              ? 0
                              : (count / Math.max(...weekdaySpread, 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className='grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]'>
        <Card className='border-border/60 rounded-[32px] shadow-sm'>
          <CardHeader className='space-y-4'>
            <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
              <div>
                <CardTitle className='text-xl'>Manage booking queue</CardTitle>
                <p className='text-muted-foreground text-sm'>
                  Switch between requests, upcoming sessions, and booking history.
                </p>
              </div>

              <div className='text-muted-foreground text-sm'>
                Showing {visibleBookings.length} of {bookings.length} bookings on page {page}
              </div>
            </div>

            <div className='flex flex-col gap-3 md:flex-row'>
              <div className='relative flex-1'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Search by student, purpose, booking id, or course id'
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  className='pl-9'
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={value => {
                  setStatusFilter(value as typeof ALL_STATUS | StatusEnum9);
                  setPage(1);
                }}
              >
                <SelectTrigger className='w-full md:w-[220px]'>
                  <FilterIcon className='text-muted-foreground h-4 w-4' />
                  <SelectValue placeholder='Filter by status' />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={value => setActiveTab(value as BookingTab)}>
              <TabsList className='w-full justify-start overflow-x-auto'>
                <TabsTrigger value='requests'>Requests ({requests.length})</TabsTrigger>
                <TabsTrigger value='upcoming'>Upcoming ({upcoming.length})</TabsTrigger>
                <TabsTrigger value='history'>History ({history.length})</TabsTrigger>
              </TabsList>

              <TabsContent value='requests' className='pt-4'>
                {renderList(
                  requests,
                  'No requests to review',
                  'Fresh booking requests that need instructor attention will appear here.'
                )}
              </TabsContent>

              <TabsContent value='upcoming' className='pt-4'>
                {renderList(
                  upcoming,
                  'No upcoming schedule',
                  'Accepted and confirmed sessions will appear here as soon as they are booked.'
                )}
              </TabsContent>

              <TabsContent value='history' className='pt-4'>
                {renderList(
                  history,
                  'No booking history',
                  'Completed, declined, expired, and cancelled bookings will accumulate here over time.'
                )}
              </TabsContent>
            </Tabs>

            <div className='mt-6 flex items-center justify-between'>
              <div className='text-muted-foreground text-xs'>
                Page {page} of {totalPages}
              </div>
              <div className='flex gap-2'>
                <Button size='sm' variant='outline' onClick={handlePrev} disabled={page <= 1}>
                  Prev
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleNext}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/60 rounded-[32px] shadow-sm'>
          <CardHeader>
            <CardTitle className='text-xl'>Booking detail and actions</CardTitle>
            <p className='text-muted-foreground text-sm'>
              Focus on a single booking to decide quickly and understand its place in the schedule.
            </p>
          </CardHeader>

          <CardContent>
            {!selected ? (
              <div className={getEmptyStateClasses()}>
                <GraduationCap className={elimikaDesignSystem.components.emptyState.icon} />
                <div className={elimikaDesignSystem.components.emptyState.title}>
                  Select a booking
                </div>
                <p className={elimikaDesignSystem.components.emptyState.description}>
                  Pick any booking from the queue or calendar agenda to see full details and take
                  action.
                </p>
              </div>
            ) : (
              <div className='space-y-6'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex items-start gap-3'>
                    <Avatar className='h-11 w-11'>
                      <AvatarFallback>
                        {(studentsById[selected.student_uuid]?.full_name ?? 'S').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className='text-lg font-semibold'>
                        {studentsById[selected.student_uuid]?.full_name ??
                          selected.student_uuid.slice(0, 8)}
                      </div>
                      <div className='text-muted-foreground text-sm'>
                        {studentsById[selected.student_uuid]?.email ?? 'No contact info available'}
                      </div>
                    </div>
                  </div>

                  <Badge className={cx('text-white capitalize', getStatusColor(selected.status))}>
                    {selected.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className='grid gap-3 md:grid-cols-2'>
                  <div className='border-border/60 rounded-3xl border p-4'>
                    <div className='text-muted-foreground text-xs tracking-[0.2em] uppercase'>
                      Session date
                    </div>
                    <div className='mt-2 font-semibold'>{formatDate(selected.start_time)}</div>
                    <div className='text-muted-foreground mt-1 text-sm'>
                      {formatTimeRange(selected.start_time, selected.end_time)}
                    </div>
                  </div>

                  <div className='border-border/60 rounded-3xl border p-4'>
                    <div className='text-muted-foreground text-xs tracking-[0.2em] uppercase'>
                      Compensation
                    </div>
                    <div className='mt-2 font-semibold'>
                      {selected.currency ?? 'KES'} {selected.price_amount ?? 0}
                    </div>
                    <div className='text-muted-foreground mt-1 text-sm'>
                      {getDurationLabel(selected.start_time, selected.end_time)}
                    </div>
                  </div>
                </div>

                <div className='border-border/60 rounded-3xl border p-4'>
                  <div className='text-muted-foreground text-xs tracking-[0.2em] uppercase'>
                    Purpose
                  </div>
                  <p className='mt-2 text-sm leading-6'>
                    {selected.purpose ??
                      'No additional booking note was provided for this session.'}
                  </p>
                </div>

                <div className='border-border/60 rounded-3xl border p-4'>
                  <div className='grid gap-4 text-sm md:grid-cols-2'>
                    <div>
                      <span className='text-muted-foreground'>Course</span>
                      <div className='mt-1 font-medium'>
                        {courseQuery.data?.data?.name ?? selected.course_uuid.slice(0, 8)}
                      </div>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>Booked on</span>
                      <div className='mt-1 font-medium'>
                        {formatDateTime(selected.created_date)}
                      </div>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>Payment engine</span>
                      <div className='mt-1 font-medium'>
                        {selected.payment_engine ?? 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>Payment status</span>
                      <div className='mt-1 font-medium'>
                        {selected.payment_reference
                          ? 'Payment reference captured'
                          : 'Awaiting payment reference'}
                      </div>
                    </div>
                    {selected.hold_expires_at && (
                      <div className='md:col-span-2'>
                        <span className='text-muted-foreground'>Hold expires</span>
                        <div className='mt-1 font-medium'>
                          {formatDateTime(selected.hold_expires_at)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex flex-col gap-3 sm:flex-row'>
                  <Button
                    variant='outline'
                    className='gap-2 sm:flex-1'
                    onClick={() => setSelectedBooking(selected)}
                  >
                    <Eye className='h-4 w-4' />
                    View full details
                  </Button>

                  {canAcceptBooking(selected.status) && (
                    <Button className='sm:flex-1' onClick={() => setOpenAcceptModal(true)}>
                      Accept booking
                    </Button>
                  )}

                  {canDeclineBooking(selected.status) && (
                    <Button
                      variant='destructive'
                      className='sm:flex-1'
                      onClick={() => setOpenDeclineModal(true)}
                    >
                      Reject booking
                    </Button>
                  )}
                </div>

                {selected.status === 'declined' && (
                  <div className='border-border/60 bg-muted/30 rounded-3xl border p-4 text-sm'>
                    <div className='flex items-center gap-2 font-medium'>
                      <XCircle className='h-4 w-4' />
                      Booking already declined
                    </div>
                    <p className='text-muted-foreground mt-2'>
                      This request is no longer part of the active schedule.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {selectedBooking && instructor && (
        <BookingDetailsModal
          booking={selectedBooking}
          open={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          instructors={[instructor]}
        />
      )}

      <ConfirmModal
        open={openAcceptModal}
        setOpen={setOpenAcceptModal}
        title='Accept booking'
        description='Are you sure you want to accept this booking request?'
        onConfirm={handleAcceptBooking}
        isLoading={acceptBooking.isPending}
        confirmText='Accept booking'
        cancelText='Cancel'
        variant='destructive'
      />

      <ConfirmModal
        open={openDeclineModal}
        setOpen={setOpenDeclineModal}
        title='Reject booking'
        description='Are you sure you want to reject this booking request?'
        onConfirm={handleDeclineBooking}
        isLoading={declineBooking.isPending}
        confirmText='Reject booking'
        cancelText='Keep booking'
        variant='destructive'
      />
    </main>
  );
}

export default BookingsPage;
