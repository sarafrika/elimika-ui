'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  cancelBookingMutation,
  getCourseByUuidOptions,
  requestPaymentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { BookingResponse, StatusEnum9 } from '@/services/client/types.gen';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  CircleAlert,
  Clock3,
  CreditCard,
  Search,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getStatusColor } from '../../_components/manage-bookings';

type BookingTab = 'attention' | 'upcoming' | 'history';

type Props = {
  bookings: BookingResponse[];
  instructors: any[];
  refetchBookings: () => void;
};

const STATUS_OPTIONS: Array<{ value: 'all' | StatusEnum9; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'payment_required', label: 'Payment required' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'accepted_confirmed', label: 'Accepted + confirmed' },
  { value: 'payment_failed', label: 'Payment failed' },
  { value: 'declined', label: 'Declined' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
];

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

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
  if (!start || !end) return 'Time unavailable';

  return `${start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })} - ${end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
};

const getDurationLabel = (start?: Date, end?: Date) => {
  if (!start || !end) return 'Unknown duration';

  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (remainder === 0) return `${hours} hr`;
  return `${hours} hr ${remainder} min`;
};

export function StudentBookingsPanel({ bookings, instructors, refetchBookings }: Props) {
  const [activeTab, setActiveTab] = useState<BookingTab>('attention');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StatusEnum9>('all');
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);

  const requestPayment = useMutation(requestPaymentMutation());
  const cancelBooking = useMutation(cancelBookingMutation());

  const now = new Date();

  const filteredBookings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return bookings.filter(booking => {
      if (statusFilter !== 'all' && booking.status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const instructor = instructors.find(item => item.uuid === booking.instructor_uuid);

      return [
        booking.uuid,
        booking.purpose,
        booking.course_uuid,
        instructor?.full_name,
        instructor?.professional_headline,
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [bookings, instructors, query, statusFilter]);

  const attentionBookings = useMemo(
    () =>
      filteredBookings.filter(booking =>
        ['payment_required', 'payment_failed', 'accepted'].includes(booking.status)
      ),
    [filteredBookings]
  );

  const upcomingBookings = useMemo(
    () =>
      filteredBookings.filter(
        booking =>
          booking.start_time >= now &&
          !['cancelled', 'declined', 'expired'].includes(booking.status)
      ),
    [filteredBookings, now]
  );

  const historyBookings = useMemo(
    () =>
      filteredBookings.filter(
        booking =>
          booking.start_time < now || ['cancelled', 'declined', 'expired'].includes(booking.status)
      ),
    [filteredBookings, now]
  );

  const visibleBookings = useMemo(() => {
    switch (activeTab) {
      case 'attention':
        return attentionBookings;
      case 'upcoming':
        return upcomingBookings;
      case 'history':
        return historyBookings;
      default:
        return filteredBookings;
    }
  }, [activeTab, attentionBookings, filteredBookings, historyBookings, upcomingBookings]);

  useEffect(() => {
    if (visibleBookings.length === 0) {
      setSelectedBooking(null);
      return;
    }

    if (
      !selectedBooking ||
      !visibleBookings.some(booking => booking.uuid === selectedBooking.uuid)
    ) {
      setSelectedBooking(visibleBookings[0]);
    }
  }, [selectedBooking, visibleBookings]);

  const selectedInstructor = useMemo(
    () => instructors.find(item => item.uuid === selectedBooking?.instructor_uuid),
    [instructors, selectedBooking]
  );

  const selectedCourse = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: selectedBooking?.course_uuid ?? '' } }),
    enabled: !!selectedBooking?.course_uuid,
  });

  const stats = useMemo(() => {
    const payable = bookings.filter(booking => booking.status === 'payment_required').length;
    const confirmed = bookings.filter(booking =>
      ['confirmed', 'accepted_confirmed'].includes(booking.status)
    ).length;
    const upcoming = bookings.filter(
      booking =>
        booking.start_time >= now && !['cancelled', 'declined', 'expired'].includes(booking.status)
    ).length;
    const bookedDays = new Set(
      bookings
        .filter(booking => booking.start_time >= now)
        .map(booking => booking.start_time.toDateString())
    ).size;

    return {
      payable,
      confirmed,
      upcoming,
      bookedDays,
    };
  }, [bookings, now]);

  const upcomingSchedule = useMemo(
    () =>
      [...bookings]
        .filter(
          booking =>
            booking.start_time >= now &&
            !['cancelled', 'declined', 'expired'].includes(booking.status)
        )
        .sort((left, right) => left.start_time.getTime() - right.start_time.getTime())
        .slice(0, 5),
    [bookings, now]
  );

  const groupedUpcomingDays = useMemo(() => {
    return upcomingSchedule.reduce<Array<{ label: string; count: number }>>((groups, booking) => {
      const label = formatDate(booking.start_time);
      const existing = groups.find(group => group.label === label);

      if (existing) {
        existing.count += 1;
      } else {
        groups.push({ label, count: 1 });
      }

      return groups;
    }, []);
  }, [upcomingSchedule]);

  const handlePayment = (booking: BookingResponse) => {
    requestPayment.mutate(
      { path: { bookingUuid: booking.uuid } },
      {
        onSuccess: response => {
          if (response?.data?.payment_url) {
            window.location.href = response.data.payment_url;
            return;
          }

          toast.error('Payment URL not found for this booking');
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to start payment');
        },
      }
    );
  };

  const handleCancel = (booking: BookingResponse) => {
    cancelBooking.mutate(
      { path: { bookingUuid: booking.uuid } },
      {
        onSuccess: () => {
          toast.success('Booking cancelled successfully');
          refetchBookings();
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to cancel booking');
        },
      }
    );
  };

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <Card className='border-border/60 rounded-[28px] shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                <CircleAlert className='h-5 w-5' />
              </div>
              <div>
                <p className='text-muted-foreground text-sm'>Need payment</p>
                <p className='text-2xl font-semibold'>{stats.payable}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/60 rounded-[28px] shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                <CalendarDays className='h-5 w-5' />
              </div>
              <div>
                <p className='text-muted-foreground text-sm'>Upcoming sessions</p>
                <p className='text-2xl font-semibold'>{stats.upcoming}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/60 rounded-[28px] shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                <Wallet className='h-5 w-5' />
              </div>
              <div>
                <p className='text-muted-foreground text-sm'>Confirmed bookings</p>
                <p className='text-2xl font-semibold'>{stats.confirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/60 rounded-[28px] shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                <Clock3 className='h-5 w-5' />
              </div>
              <div>
                <p className='text-muted-foreground text-sm'>Booked days ahead</p>
                <p className='text-2xl font-semibold'>{stats.bookedDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]'>
        <Card className='border-border/60 rounded-[32px] shadow-sm'>
          <CardHeader className='space-y-4'>
            <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
              <div>
                <CardTitle className='text-xl'>My bookings</CardTitle>
                <p className='text-muted-foreground text-sm'>
                  See pending payments, upcoming sessions, and closed bookings in one place.
                </p>
              </div>

              <div className='text-muted-foreground text-sm'>
                {visibleBookings.length} booking{visibleBookings.length === 1 ? '' : 's'} shown
              </div>
            </div>

            <div className='flex flex-col gap-3 md:flex-row'>
              <div className='relative flex-1'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder='Search by instructor, purpose, or course'
                  className='pl-9'
                />
              </div>

              <Select value={statusFilter} onValueChange={value => setStatusFilter(value as any)}>
                <SelectTrigger className='w-full md:w-[220px]'>
                  <SelectValue placeholder='Filter status' />
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
                <TabsTrigger value='attention'>Attention ({attentionBookings.length})</TabsTrigger>
                <TabsTrigger value='upcoming'>Upcoming ({upcomingBookings.length})</TabsTrigger>
                <TabsTrigger value='history'>History ({historyBookings.length})</TabsTrigger>
              </TabsList>

              {(['attention', 'upcoming', 'history'] as BookingTab[]).map(tab => {
                const items =
                  tab === 'attention'
                    ? attentionBookings
                    : tab === 'upcoming'
                      ? upcomingBookings
                      : historyBookings;

                return (
                  <TabsContent key={tab} value={tab} className='pt-4'>
                    {items.length === 0 ? (
                      <div className='border-border rounded-[28px] border border-dashed p-10 text-center'>
                        <p className='text-muted-foreground text-sm'>
                          No bookings in this section yet.
                        </p>
                      </div>
                    ) : (
                      <div className='space-y-3'>
                        {items.map(booking => {
                          const instructor = instructors.find(
                            item => item.uuid === booking.instructor_uuid
                          );
                          const isActive = selectedBooking?.uuid === booking.uuid;

                          return (
                            <button
                              key={booking.uuid}
                              type='button'
                              onClick={() => setSelectedBooking(booking)}
                              className={`w-full rounded-3xl border p-4 text-left transition ${
                                isActive
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/30 hover:bg-muted/40'
                              }`}
                            >
                              <div className='flex items-start justify-between gap-3'>
                                <div className='space-y-1'>
                                  <div className='font-semibold'>
                                    {instructor?.full_name ?? 'Instructor'}
                                  </div>
                                  <div className='text-muted-foreground text-sm'>
                                    {booking.purpose ?? 'No booking note provided'}
                                  </div>
                                </div>

                                <Badge
                                  className={`text-white capitalize ${getStatusColor(booking.status)}`}
                                >
                                  {booking.status.replace('_', ' ')}
                                </Badge>
                              </div>

                              <div className='mt-4 grid gap-2 text-sm md:grid-cols-2'>
                                <div className='text-muted-foreground'>
                                  {formatDate(booking.start_time)}
                                </div>
                                <div className='text-muted-foreground'>
                                  {formatTimeRange(booking.start_time, booking.end_time)}
                                </div>
                                <div className='font-medium'>
                                  {booking.currency ?? 'KES'} {booking.price_amount ?? 0}
                                </div>
                                <div className='text-muted-foreground'>
                                  {getDurationLabel(booking.start_time, booking.end_time)}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>

        <div className='space-y-6'>
          <Card className='border-border/60 rounded-[32px] shadow-sm'>
            <CardHeader>
              <CardTitle className='text-xl'>Booking detail</CardTitle>
              <p className='text-muted-foreground text-sm'>
                Review the selected session before you pay or make changes.
              </p>
            </CardHeader>

            <CardContent>
              {!selectedBooking ? (
                <div className='border-border rounded-[28px] border border-dashed p-10 text-center'>
                  <p className='text-muted-foreground text-sm'>
                    Pick a booking from the list to see the full session detail.
                  </p>
                </div>
              ) : (
                <div className='space-y-6'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <div className='text-lg font-semibold'>
                        {selectedInstructor?.full_name ?? 'Instructor'}
                      </div>
                      <div className='text-muted-foreground text-sm'>
                        {selectedInstructor?.professional_headline ?? 'Training instructor'}
                      </div>
                    </div>
                    <Badge
                      className={`text-white capitalize ${getStatusColor(selectedBooking.status)}`}
                    >
                      {selectedBooking.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className='grid gap-3 md:grid-cols-2'>
                    <div className='border-border/60 rounded-3xl border p-4'>
                      <div className='text-muted-foreground text-xs tracking-[0.2em] uppercase'>
                        Session date
                      </div>
                      <div className='mt-2 font-semibold'>
                        {formatDate(selectedBooking.start_time)}
                      </div>
                      <div className='text-muted-foreground mt-1 text-sm'>
                        {formatTimeRange(selectedBooking.start_time, selectedBooking.end_time)}
                      </div>
                    </div>

                    <div className='border-border/60 rounded-3xl border p-4'>
                      <div className='text-muted-foreground text-xs tracking-[0.2em] uppercase'>
                        Amount
                      </div>
                      <div className='mt-2 font-semibold'>
                        {selectedBooking.currency ?? 'KES'} {selectedBooking.price_amount ?? 0}
                      </div>
                      <div className='text-muted-foreground mt-1 text-sm'>
                        {getDurationLabel(selectedBooking.start_time, selectedBooking.end_time)}
                      </div>
                    </div>
                  </div>

                  <div className='border-border/60 rounded-3xl border p-4'>
                    <div className='text-muted-foreground text-xs tracking-[0.2em] uppercase'>
                      Course
                    </div>
                    <div className='mt-2 font-medium'>
                      {selectedCourse.data?.data?.name ?? selectedBooking.course_uuid.slice(0, 8)}
                    </div>
                  </div>

                  <div className='border-border/60 rounded-3xl border p-4'>
                    <div className='text-muted-foreground text-xs tracking-[0.2em] uppercase'>
                      Purpose
                    </div>
                    <p className='mt-2 text-sm leading-6'>
                      {selectedBooking.purpose ?? 'No additional booking purpose was supplied.'}
                    </p>
                  </div>

                  <div className='border-border/60 rounded-3xl border p-4'>
                    <div className='grid gap-4 text-sm md:grid-cols-2'>
                      <div>
                        <span className='text-muted-foreground'>Booked on</span>
                        <div className='mt-1 font-medium'>
                          {formatDateTime(selectedBooking.created_date)}
                        </div>
                      </div>
                      <div>
                        <span className='text-muted-foreground'>Payment engine</span>
                        <div className='mt-1 font-medium'>
                          {selectedBooking.payment_engine ?? 'Not specified'}
                        </div>
                      </div>
                      {selectedBooking.hold_expires_at && (
                        <div className='md:col-span-2'>
                          <span className='text-muted-foreground'>Payment hold expires</span>
                          <div className='mt-1 font-medium'>
                            {formatDateTime(selectedBooking.hold_expires_at)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='flex flex-col gap-3'>
                    {selectedBooking.status === 'payment_required' && (
                      <Button
                        className='w-full gap-2'
                        onClick={() => handlePayment(selectedBooking)}
                        disabled={requestPayment.isPending}
                      >
                        <CreditCard className='h-4 w-4' />
                        Complete payment
                      </Button>
                    )}

                    {!['cancelled', 'declined', 'expired'].includes(selectedBooking.status) && (
                      <Button
                        variant='outline'
                        className='w-full gap-2'
                        onClick={() => handleCancel(selectedBooking)}
                        disabled={cancelBooking.isPending}
                      >
                        <XCircle className='h-4 w-4' />
                        Cancel booking
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='border-border/60 rounded-[32px] shadow-sm'>
            <CardHeader>
              <CardTitle className='text-xl'>Upcoming cadence</CardTitle>
              <p className='text-muted-foreground text-sm'>
                Quick look at how your future sessions are distributed.
              </p>
            </CardHeader>

            <CardContent className='space-y-4'>
              {groupedUpcomingDays.length === 0 ? (
                <div className='border-border rounded-[28px] border border-dashed p-8 text-center'>
                  <p className='text-muted-foreground text-sm'>No future sessions scheduled yet.</p>
                </div>
              ) : (
                groupedUpcomingDays.map(group => (
                  <div key={group.label} className='space-y-2'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>{group.label}</span>
                      <span className='font-medium'>
                        {group.count} session{group.count === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className='bg-muted h-2 rounded-full'>
                      <div
                        className='bg-primary h-2 rounded-full'
                        style={{
                          width: `${Math.max(
                            10,
                            (group.count /
                              Math.max(...groupedUpcomingDays.map(item => item.count), 1)) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}

              <Separator />

              <div className='space-y-3'>
                {upcomingSchedule.map(booking => {
                  const instructor = instructors.find(
                    item => item.uuid === booking.instructor_uuid
                  );
                  return (
                    <div
                      key={booking.uuid}
                      className={`rounded-2xl border p-3 ${
                        selectedBooking?.uuid === booking.uuid
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div className='flex items-center justify-between gap-3 text-sm'>
                        <div>
                          <div className='font-medium'>{instructor?.full_name ?? 'Instructor'}</div>
                          <div className='text-muted-foreground'>
                            {formatDate(booking.start_time)} •{' '}
                            {formatTimeRange(booking.start_time, booking.end_time)}
                          </div>
                        </div>
                        <Badge variant='secondary'>
                          {isSameDay(booking.start_time, now) ? 'Today' : 'Upcoming'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
