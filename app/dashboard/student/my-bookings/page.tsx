'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AvatarWithSkeleton } from '@/components/avatar-with-skeleton';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import { useCoursesByIds, useInstructorsByIds } from '@/hooks/use-batched-lookups';
import { cn } from '@/lib/utils';
import {
  getStudentBookingsOptions,
  requestPaymentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { BookingResponse } from '@/services/client/types.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { getErrorMessage } from '@/src/features/dashboard/courses/types';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';

const PAGE_SIZE = 15;

const PAYABLE_STATUSES = ['accepted', 'payment_required', 'payment_failed'] as const;
const CONFIRMED_STATUSES = ['confirmed', 'accepted_confirmed'];
const CLOSED_STATUSES = ['declined', 'cancelled', 'expired'];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Awaiting response' },
  { key: 'payment', label: 'Action needed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'closed', label: 'Closed/Expired' },
] as const;

type BookingFilter = (typeof FILTERS)[number]['key'];

const getBucket = (booking: BookingResponse): BookingFilter => {
  if (CONFIRMED_STATUSES.includes(booking.status)) return 'confirmed';
  if (CLOSED_STATUSES.includes(booking.status)) return 'closed';
  if (PAYABLE_STATUSES.includes(booking.status as (typeof PAYABLE_STATUSES)[number])) return 'payment';
  return 'pending';
};

const getStatusLabel = (status?: string) => (status ? status.replace(/_/g, ' ') : 'unknown');

const getStatusChip = (status?: string) => {
  switch (status) {
    case 'payment_required':
      return 'border-primary/20 bg-primary/10 text-primary';
    case 'accepted':
      return 'border-warning/20 bg-warning/5 text-warning/70';
    case 'payment_failed':
      return 'border-destructive/20 bg-destructive/10 text-destructive';
    case 'confirmed':
    case 'accepted_confirmed':
      return 'border-success/20 bg-success/10 text-success';
    case 'declined':
    case 'cancelled':
    case 'expired':
      return 'border-transparent bg-muted text-muted-foreground';
    default:
      return 'border-transparent bg-muted text-muted-foreground';
  }
};

const formatDate = (date?: Date) =>
  date
    ? date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'No date';

const formatTimeRange = (start?: Date, end?: Date) => {
  if (!start || !end) return 'Time not available';
  return `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString(
    'en-US',
    { hour: 'numeric', minute: '2-digit' }
  )}`;
};

const formatMoney = (amount?: number, currency = 'KES') => {
  if (amount == null) return 'Not set';
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

function StudentBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { activeDomain } = useUserDomain();
  const student = useStudent();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<BookingFilter>('all');
  const [selectedBookingUuid, setSelectedBookingUuid] = useState<string | null>(null);

  useEffect(() => {
    replaceBreadcrumbs([
      {
        id: 'dashboard',
        title: 'Dashboard',
        url: buildWorkspaceAliasPath(activeDomain, '/dashboard/overview'),
      },
      {
        id: 'student-bookings',
        title: 'My Bookings',
        url: buildWorkspaceAliasPath(activeDomain, '/dashboard/student/my-bookings'),
        isLast: true,
      },
    ]);
  }, [activeDomain, replaceBreadcrumbs]);

  const bookingsQuery = useQuery({
    ...getStudentBookingsOptions({
      path: { studentUuid: student?.uuid ?? '' },
      query: {
        pageable: { page: Math.max(0, page - 1), size: PAGE_SIZE },
        status: '',
      },
    }),
    enabled: Boolean(student?.uuid),
  });

  const bookings = useMemo<BookingResponse[]>(() => bookingsQuery.data?.data?.content ?? [], [bookingsQuery.data]);

  const totalPages = Math.max(
    1,
    bookingsQuery.data?.data?.metadata?.totalPages ?? (bookings.length ? Math.ceil(bookings.length / PAGE_SIZE) : 1)
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return bookings;
    return bookings.filter(booking => getBucket(booking) === filter);
  }, [bookings, filter]);

  const bookingUuidFromUrl = searchParams.get('bookingUuid');

  useEffect(() => {
    if (bookingUuidFromUrl && filtered.some(booking => booking.uuid === bookingUuidFromUrl)) {
      setSelectedBookingUuid(bookingUuidFromUrl);
      return;
    }

    if (!selectedBookingUuid && filtered[0]?.uuid) {
      setSelectedBookingUuid(filtered[0].uuid);
      return;
    }

    if (
      selectedBookingUuid &&
      !filtered.some(booking => booking.uuid === selectedBookingUuid) &&
      filtered[0]?.uuid
    ) {
      setSelectedBookingUuid(filtered[0].uuid);
    }
  }, [bookingUuidFromUrl, filtered, selectedBookingUuid]);

  const instructorUuids = useMemo(
    () => Array.from(new Set(bookings.map(booking => booking.instructor_uuid).filter(Boolean))),
    [bookings]
  );
  const courseUuids = useMemo(
    () => Array.from(new Set(bookings.map(booking => booking.course_uuid).filter(Boolean))),
    [bookings]
  );

  const { instructorMap, isLoading: instructorsLoading } = useInstructorsByIds(instructorUuids);
  const { courseMap, isLoading: coursesLoading } = useCoursesByIds(courseUuids);

  const selectedBooking =
    filtered.find(booking => booking.uuid === selectedBookingUuid) ?? filtered[0] ?? null;

  const isLoading = bookingsQuery.isLoading || instructorsLoading || coursesLoading;

  const pending = bookings.filter(booking => getBucket(booking) === 'pending').length;
  const awaitingPayment = bookings.filter(booking => getBucket(booking) === 'payment').length;
  const confirmed = bookings.filter(booking => getBucket(booking) === 'confirmed').length;

  const paymentMutation = useMutation(requestPaymentMutation());

  const handlePay = async (booking: BookingResponse) => {
    if (!student?.uuid) return;

    try {
      const response = await paymentMutation.mutateAsync({
        path: { bookingUuid: booking.uuid },
        body: { payment_engine: booking.payment_engine ?? 'mpesa' },
      });

      await queryClient.invalidateQueries({
        predicate: query =>
          query.queryKey[0] === 'getStudentBookings' &&
          (query.queryKey[1] as { path?: { studentUuid?: string } } | undefined)?.path?.studentUuid ===
          student.uuid,
      });

      const paymentUrl = response?.data?.payment_url;
      if (paymentUrl) {
        window.location.assign(paymentUrl);
        return;
      }

      toast.success(response?.message || 'Payment request sent.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not start payment for this booking.'));
    }
  };

  return (
    <div className='space-y-6 px-4 sm:px-6 py-4 pb-10'>
      <PageHeader
        eyebrow=''
        title='My Bookings'
        description='Track the instructor bookings you sent, review the schedule, and pay once the instructor accepts and requests payment.'
        action={
          <Button
            onClick={() =>
              router.push(buildWorkspaceAliasPath(activeDomain, '/dashboard/student/courses'))
            }
          >
            Search instructors
          </Button>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard label='Total bookings' value={String(bookings.length)} icon={CalendarDays} />
        <StatCard label='Awaiting response' value={String(pending)} icon={Clock} />
        <StatCard label='Payment requested' value={String(awaitingPayment)} icon={CreditCard} tone='violet' />
        <StatCard label='Confirmed' value={String(confirmed)} icon={CheckCircle2} tone='teal' />
      </div>

      <Tabs value={filter} onValueChange={value => setFilter(value as BookingFilter)}>
        <TabsList className='w-full justify-start overflow-x-auto'>
          {FILTERS.map(f => (
            <TabsTrigger key={f.key} value={f.key}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-32 w-full rounded-xl' />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title='No bookings here yet'
          description='Book an instructor to start private or group training sessions.'
          action={
            <Button
              onClick={() =>
                router.push(buildWorkspaceAliasPath(activeDomain, '/dashboard/student/courses'))
              }
            >
              Search instructors
            </Button>
          }
        />
      ) : (
        <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]'>
          <div className='space-y-3'>
            {filtered.map(booking => {
              const instructor = instructorMap[booking.instructor_uuid];
              const course = courseMap[booking.course_uuid];
              const selected = selectedBooking?.uuid === booking.uuid;

              return (
                <button
                  key={booking.uuid}
                  type='button'
                  onClick={() => setSelectedBookingUuid(booking.uuid)}
                  className={cn(
                    'w-full rounded-xl border bg-card p-4 text-left transition hover:border-primary/40',
                    selected && 'border-primary ring-1 ring-primary/30'
                  )}
                >
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div className='flex min-w-0 items-center gap-3'>
                      <AvatarWithSkeleton
                        alt={instructor?.full_name ?? 'Instructor'}
                        name={instructor?.full_name ?? 'Instructor'}
                        className='h-10 w-10'
                      />
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-semibold'>
                          {course?.name ?? 'Course details not available'}
                        </p>
                        <p className='truncate text-xs text-muted-foreground'>
                          {instructor?.full_name ?? 'Instructor'}
                        </p>
                      </div>
                    </div>
                    <Badge variant='outline' className={cn('shrink-0', getStatusChip(booking.status))}>
                      {getStatusLabel(booking.status)}
                    </Badge>
                  </div>
                  <div className='mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
                    <span className='flex items-center gap-1'>
                      <CalendarDays className='h-3.5 w-3.5' /> {formatDate(booking.start_time)}
                    </span>
                    <span className='flex items-center gap-1'>
                      <Clock className='h-3.5 w-3.5' /> {formatTimeRange(booking.start_time, booking.end_time)}
                    </span>
                    <span className='font-medium text-foreground'>
                      {formatMoney(booking.price_amount, booking.currency ?? 'KES')}
                    </span>
                  </div>
                </button>
              );
            })}

            {totalPages > 1 ? (
              <div className='flex items-center justify-between gap-3 pt-2'>
                <p className='text-xs text-muted-foreground'>
                  Page {page} of {totalPages}
                </p>
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    disabled={page <= 1}
                    onClick={() => setPage(current => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    disabled={page >= totalPages}
                    onClick={() => setPage(current => Math.min(totalPages, current + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {selectedBooking && (
            <BookingDetailPanel
              booking={selectedBooking}
              instructorName={instructorMap[selectedBooking.instructor_uuid]?.full_name}
              instructorHeadline={instructorMap[selectedBooking.instructor_uuid]?.professional_headline}
              courseName={courseMap[selectedBooking.course_uuid]?.name}
              onPay={() => handlePay(selectedBooking)}
              paying={paymentMutation.isPending}
            />
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'muted',
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone?: 'muted' | 'teal' | 'violet';
}) {
  const toneCls =
    tone === 'teal'
      ? 'bg-primary/10 text-primary'
      : tone === 'violet'
        ? 'bg-violet-100 text-violet-700'
        : 'bg-muted text-muted-foreground';
  return (
    <Card className='border-border rounded-md py-1'>
      <CardContent className='flex items-center gap-3 p-4'>
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg', toneCls)}>
          <Icon className='h-5 w-5' />
        </span>
        <div>
          <p className='text-xs text-muted-foreground'>{label}</p>
          <p className='text-lg font-semibold'>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingDetailPanel({
  booking,
  instructorName,
  instructorHeadline,
  courseName,
  onPay,
  paying,
}: {
  booking: BookingResponse;
  instructorName?: string;
  instructorHeadline?: string;
  courseName?: string;
  onPay: () => void;
  paying: boolean;
}) {
  const canPay = PAYABLE_STATUSES.includes(booking.status as (typeof PAYABLE_STATUSES)[number]);
  const isPaid = Boolean(booking.payment_reference) || CONFIRMED_STATUSES.includes(booking.status);

  return (
    <Card className='h-fit lg:sticky lg:top-20'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle className='text-base'>Booking details</CardTitle>
          <Badge variant='outline' className={getStatusChip(booking.status)}>
            {getStatusLabel(booking.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-4 text-sm'>
        <div className='flex items-center gap-3'>
          <AvatarWithSkeleton alt={instructorName ?? 'Instructor'} name={instructorName ?? 'Instructor'} className='h-10 w-10' />
          <div>
            <p className='font-medium'>{instructorName ?? 'Instructor'}</p>
            <p className='text-xs text-muted-foreground'>
              {instructorHeadline ?? 'Selected booking instructor'}
            </p>
          </div>
        </div>

        <div className='space-y-1.5 text-xs'>
          <Row label='Course' value={courseName ?? 'Not available'} />
          <Row label='Session' value={formatDate(booking.start_time)} />
          <Row label='Time' value={formatTimeRange(booking.start_time, booking.end_time)} />
          <Row label='Amount' value={formatMoney(booking.price_amount, booking.currency ?? 'KES')} />
        </div>

        {booking.purpose?.trim() ? (
          <p className='rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground'>
            &ldquo;{booking.purpose.trim()}&rdquo;
          </p>
        ) : null}

        <Separator />

        <div className='space-y-1.5 text-xs'>
          <Row label='Payment session' value={booking.payment_session_id ?? 'Not requested yet'} />
          <Row label='Payment reference' value={booking.payment_reference ?? 'Pending'} />
          <Row
            label='Hold expires'
            value={
              booking.hold_expires_at
                ? booking.hold_expires_at.toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })
                : 'No hold yet'
            }
          />
        </div>

        <Separator />

        <div className='space-y-3 rounded-xl border bg-muted/20 p-3'>
          <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Confirm & pay</p>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Amount due</span>
            <span className='font-semibold'>{formatMoney(booking.price_amount, booking.currency ?? 'KES')}</span>
          </div>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span>Payment engine</span>
            <span className='font-medium capitalize'>{booking.payment_engine?.replace('-', ' ') ?? 'mpesa'}</span>
          </div>

          {isPaid ? (
            <p className='flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs text-success'>
              <CheckCircle2 className='h-4 w-4' /> Paid — your session is confirmed.
            </p>
          ) : (
            <Button className='w-full' disabled={!canPay || paying} onClick={onPay}>
              {paying ? (
                'Starting payment…'
              ) : canPay ? (
                <>
                  Confirm and pay
                  <ArrowRight className='ml-2 h-4 w-4' />
                </>
              ) : (
                'Waiting for instructor'
              )}
            </Button>
          )}
          {!canPay && !isPaid && (
            <p className='text-center text-[11px] text-muted-foreground'>
              Payment opens once {instructorName ?? 'the instructor'} accepts and requests payment.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-start justify-between gap-3'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='text-right font-medium text-foreground'>{value}</span>
    </div>
  );
}

export default StudentBookingPage;