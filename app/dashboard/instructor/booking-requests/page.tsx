'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Inbox,
  X,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AvatarWithSkeleton } from '@/components/avatar-with-skeleton';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { useCoursesByIds, useStudentsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { cn } from '@/lib/utils';
import {
  acceptBookingMutation,
  cancelBookingMutation,
  declineBookingMutation,
  getInstructorBookingsOptions,
  requestPaymentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { BookingResponse, Student, User } from '@/services/client/types.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { getErrorMessage } from '@/src/features/dashboard/courses/types';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

const PAGE_SIZE = 15;

const FILTERS = [
  { key: 'pending', label: 'New requests' },
  { key: 'active', label: 'Accepted & awaiting payment' },
  { key: 'paid', label: 'Confirmed' },
  { key: 'closed', label: 'Declined / Expired' },
  { key: 'all', label: 'All' },
] as const;

type BookingFilter = (typeof FILTERS)[number]['key'];

const CONFIRMED_STATUSES = new Set(['confirmed', 'accepted_confirmed']);
const ACTIVE_STATUSES = new Set(['accepted', 'payment_required', 'payment_failed']);
const CLOSED_STATUSES = new Set(['declined', 'cancelled', 'expired']);

const formatDate = (date?: Date) =>
  date
    ? date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'No date';

const formatTime = (date?: Date) =>
  date ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '--';

const formatTimeRange = (start?: Date, end?: Date) => {
  if (!start || !end) return 'Time not available';
  return `${formatTime(start)} - ${formatTime(end)}`;
};

const formatDateTime = (date?: Date) =>
  date
    ? date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'No date';

const formatMoney = (amount?: number, currency = 'KES') => {
  if (amount == null) return 'Not set';
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  payment_required: 'Awaiting payment',
  payment_failed: 'Payment failed',
  confirmed: 'Confirmed',
  accepted_confirmed: 'Confirmed',
  declined: 'Declined',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

const getStatusLabel = (status?: string) =>
  (status && STATUS_LABEL[status]) || (status ? status.replace(/_/g, ' ') : 'Unknown');

const getStatusChip = (status?: string) => {
  if (!status) return 'bg-muted text-muted-foreground';
  if (CONFIRMED_STATUSES.has(status)) return 'bg-primary/10 text-primary border-primary/20';
  if (ACTIVE_STATUSES.has(status)) return 'bg-violet-100 text-violet-700 border-violet-200';
  if (CLOSED_STATUSES.has(status)) return 'bg-muted text-muted-foreground border-transparent';
  return 'bg-warning text-warning/70 border-warning/20';
};

const getBucket = (booking: BookingResponse): BookingFilter | 'pending' => {
  if (CONFIRMED_STATUSES.has(booking.status)) return 'paid';
  if (CLOSED_STATUSES.has(booking.status)) return 'closed';
  if (ACTIVE_STATUSES.has(booking.status)) return 'active';
  return 'pending';
};

const isBookingActionable = (booking: BookingResponse) =>
  !CONFIRMED_STATUSES.has(booking.status) && !CLOSED_STATUSES.has(booking.status);

const getBookingStudentName = (student?: Student, user?: User) =>
  user?.full_name ?? student?.full_name ?? 'Student';

function InstructorBookingRequestsPage() {
  const searchParams = useSearchParams();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { activeDomain } = useUserDomain();
  const instructor = useInstructor();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<BookingFilter>('pending');
  const [acceptTarget, setAcceptTarget] = useState<BookingResponse | null>(null);
  const [declineTarget, setDeclineTarget] = useState<BookingResponse | null>(null);

  useEffect(() => {
    replaceBreadcrumbs([
      {
        id: 'dashboard',
        title: 'Dashboard',
        url: buildWorkspaceAliasPath(activeDomain, '/dashboard/overview'),
      },
      {
        id: 'booking-requests',
        title: 'Booking Requests',
        url: buildWorkspaceAliasPath(activeDomain, '/dashboard/instructor/booking-requests'),
        isLast: true,
      },
    ]);
  }, [activeDomain, replaceBreadcrumbs]);

  const bookingsQuery = useQuery({
    ...getInstructorBookingsOptions({
      path: { instructorUuid: instructor?.uuid ?? '' },
      query: {
        pageable: { page: Math.max(0, page - 1), size: PAGE_SIZE },
        status: '',
      },
    }),
    enabled: Boolean(instructor?.uuid),
  });

  const bookings = useMemo<BookingResponse[]>(() => bookingsQuery.data?.data?.content ?? [], [bookingsQuery.data]);

  const totalPages = Math.max(
    1,
    bookingsQuery.data?.data?.metadata?.totalPages ?? (bookings.length ? Math.ceil(bookings.length / PAGE_SIZE) : 1)
  );

  const studentUuids = useMemo(
    () => Array.from(new Set(bookings.map(booking => booking.student_uuid).filter(Boolean))),
    [bookings]
  );
  const courseUuids = useMemo(
    () => Array.from(new Set(bookings.map(booking => booking.course_uuid).filter(Boolean))),
    [bookings]
  );

  const { studentMap, isLoading: studentsLoading } = useStudentsByIds(studentUuids);
  const { courseMap, isLoading: coursesLoading } = useCoursesByIds(courseUuids);

  const studentUserUuids = useMemo(
    () => Object.values(studentMap).map(student => student.user_uuid).filter(Boolean),
    [studentMap]
  );
  const { userMap, isLoading: usersLoading } = useUsersByIds(studentUserUuids);

  // Preselect a booking's dialog from the URL, e.g. after following a notification link.
  useEffect(() => {
    const bookingUuidFromUrl = searchParams.get('bookingUuid');
    if (!bookingUuidFromUrl) return;
    const target = bookings.find(booking => booking.uuid === bookingUuidFromUrl);
    if (target && isBookingActionable(target) && !acceptTarget && !declineTarget) {
      setAcceptTarget(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, searchParams]);

  const filtered = useMemo(() => {
    if (filter === 'all') return bookings;
    return bookings.filter(booking => getBucket(booking) === filter);
  }, [bookings, filter]);

  const pending = bookings.filter(booking => getBucket(booking) === 'pending').length;
  const expected = bookings
    .filter(booking => ACTIVE_STATUSES.has(booking.status))
    .reduce((sum, booking) => sum + (booking.price_amount ?? 0), 0);
  const earned = bookings
    .filter(booking => CONFIRMED_STATUSES.has(booking.status))
    .reduce((sum, booking) => sum + (booking.price_amount ?? 0), 0);

  const isLoading = bookingsQuery.isLoading || studentsLoading || coursesLoading || usersLoading;

  const acceptBooking = useMutation(acceptBookingMutation());
  const declineBooking = useMutation(declineBookingMutation());
  const cancelBooking = useMutation(cancelBookingMutation());
  const requestPayment = useMutation(requestPaymentMutation());

  const refreshQueries = async (booking: BookingResponse | null) => {
    if (!instructor?.uuid) return;

    await queryClient.invalidateQueries({
      predicate: query =>
        query.queryKey[0] === 'getInstructorBookings' &&
        (query.queryKey[1] as { path?: { instructorUuid?: string } } | undefined)?.path?.instructorUuid ===
        instructor.uuid,
    });

    if (booking?.student_uuid) {
      await queryClient.invalidateQueries({
        predicate: query =>
          query.queryKey[0] === 'getStudentBookings' &&
          (query.queryKey[1] as { path?: { studentUuid?: string } } | undefined)?.path?.studentUuid ===
          booking.student_uuid,
      });
    }
  };

  return (
    <div className='space-y-6 px-4 sm:px-6 py-4 pb-10'>
      <PageHeader
        eyebrow=''
        title='Booking Requests'
        description='Review student booking requests, accept and request payment, or decline and cancel.'
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard label='New requests' value={String(pending)} icon={Inbox} />
        <StatCard label='Awaiting payment' value={formatMoney(expected)} icon={CreditCard} tone='violet' />
        <StatCard label='Confirmed earnings' value={formatMoney(earned)} icon={CheckCircle2} tone='teal' />
        <StatCard label='Total bookings' value={String(bookings.length)} icon={CalendarDays} />
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
        <div className='space-y-4'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-40 w-full rounded-xl' />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title='Nothing here'
          description='Student booking requests directed to you will appear in this list.'
        />
      ) : (
        <div className='space-y-4'>
          {filtered.map(booking => (
            <RequestCard
              key={booking.uuid}
              booking={booking}
              student={studentMap[booking.student_uuid]}
              studentUser={userMap[studentMap[booking.student_uuid]?.user_uuid]}
              courseName={courseMap[booking.course_uuid]?.name}
              onAccept={() => setAcceptTarget(booking)}
              onDecline={() => setDeclineTarget(booking)}
            />
          ))}
        </div>
      )}

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

      <AcceptDialog
        booking={acceptTarget}
        student={acceptTarget ? studentMap[acceptTarget.student_uuid] : undefined}
        studentUser={
          acceptTarget ? userMap[studentMap[acceptTarget.student_uuid]?.user_uuid] : undefined
        }
        courseName={acceptTarget ? courseMap[acceptTarget.course_uuid]?.name : undefined}
        acceptBooking={acceptBooking}
        requestPayment={requestPayment}
        onClose={() => setAcceptTarget(null)}
        onDone={refreshQueries}
      />
      <DeclineDialog
        booking={declineTarget}
        studentName={
          declineTarget
            ? getBookingStudentName(
              studentMap[declineTarget.student_uuid],
              userMap[studentMap[declineTarget.student_uuid]?.user_uuid]
            )
            : ''
        }
        declineBooking={declineBooking}
        cancelBooking={cancelBooking}
        onClose={() => setDeclineTarget(null)}
        onDone={refreshQueries}
      />
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
    <Card className='py-2'>
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

function RequestCard({
  booking,
  student,
  studentUser,
  courseName,
  onAccept,
  onDecline,
}: {
  booking: BookingResponse;
  student?: Student;
  studentUser?: User;
  courseName?: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const name = getBookingStudentName(student, studentUser);
  const avatarSrc = toAuthenticatedMediaUrl(studentUser?.profile_image_url) ?? undefined;
  const actionable = isBookingActionable(booking);

  return (
    <Card className='border-border py-0'>
      <CardContent className='space-y-4 p-4 sm:p-5'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='flex min-w-0 items-center gap-3'>
            <AvatarWithSkeleton src={avatarSrc} alt={name} name={name} className='h-11 w-11' />
            <div className='min-w-0'>
              <p className='truncate text-sm font-semibold'>{name}</p>
              <p className='truncate text-xs text-muted-foreground'>
                {courseName ?? 'Course details not available'}
              </p>
            </div>
          </div>
          <Badge variant='outline' className={getStatusChip(booking.status)}>
            {getStatusLabel(booking.status)}
          </Badge>
        </div>

        <div className='grid gap-3 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4'>
          <span className='flex items-center gap-1.5'>
            <CalendarDays className='h-3.5 w-3.5' /> {formatDate(booking.start_time)}
          </span>
          <span className='flex items-center gap-1.5'>
            <Clock className='h-3.5 w-3.5' /> {formatTimeRange(booking.start_time, booking.end_time)}
          </span>
          <span className='flex items-center gap-1.5'>
            Requested {formatDateTime(booking.created_date)}
          </span>
          <span className='font-semibold text-foreground'>
            {formatMoney(booking.price_amount, booking.currency ?? 'KES')}
          </span>
        </div>

        {booking.purpose?.trim() ? (
          <p className='rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground'>
            &ldquo;{booking.purpose.trim()}&rdquo;
          </p>
        ) : null}

        {booking.status === 'payment_failed' ? (
          <div className='flex items-center gap-1.5 rounded-lg border border-warning/20 bg-warning/5 p-3 text-xs text-warning/70'>
            <AlertTriangle className='h-3.5 w-3.5' /> Payment previously failed. You can request it again
            if the slot is still valid.
          </div>
        ) : null}

        <Separator />

        <div className='flex flex-wrap items-center justify-between gap-3'>
          <p className='text-xs text-muted-foreground'>
            {booking.payment_reference
              ? `Payment reference ${booking.payment_reference}`
              : booking.hold_expires_at
                ? `Hold expires ${formatDateTime(booking.hold_expires_at)}`
                : 'No hold timer'}
          </p>
          {actionable ? (
            <div className='flex gap-2'>
              <Button variant='outline' onClick={onDecline}>
                <X className='mr-2 h-4 w-4' /> Decline & cancel
              </Button>
              <Button onClick={onAccept}>
                <Check className='mr-2 h-4 w-4' /> Accept & request payment
              </Button>
            </div>
          ) : (
            <p className='text-xs text-muted-foreground'>
              {CONFIRMED_STATUSES.has(booking.status)
                ? 'Payment received — session confirmed.'
                : 'No further action needed.'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AcceptDialog({
  booking,
  student,
  studentUser,
  courseName,
  acceptBooking,
  requestPayment,
  onClose,
  onDone,
}: {
  booking: BookingResponse | null;
  student?: Student;
  studentUser?: User;
  courseName?: string;
  acceptBooking: ReturnType<typeof useMutation>;
  requestPayment: ReturnType<typeof useMutation>;
  onClose: () => void;
  onDone: (booking: BookingResponse | null) => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const name = getBookingStudentName(student, studentUser);
  const needsAcceptance = booking ? !ACTIVE_STATUSES.has(booking.status) : false;

  async function confirm() {
    if (!booking) return;
    setBusy(true);
    try {
      if (needsAcceptance) {
        await acceptBooking.mutateAsync({ path: { bookingUuid: booking.uuid } });
      }
      await requestPayment.mutateAsync({
        path: { bookingUuid: booking.uuid },
        body: { payment_engine: booking.payment_engine ?? 'mpesa' },
      });
      await onDone(booking);
      toast.success('Booking accepted', {
        description: `${name} has been notified to pay ${formatMoney(
          booking.price_amount,
          booking.currency ?? 'KES'
        )}.`,
      });
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not accept this booking.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!booking} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Accept booking & request payment</DialogTitle>
          <DialogDescription>
            {name} will be notified and can pay immediately to confirm the session.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-3 rounded-lg bg-muted/40 p-3 text-sm'>
          <div className='flex justify-between gap-3'>
            <span className='text-muted-foreground'>Course</span>
            <span className='font-medium'>{courseName ?? 'Course details not available'}</span>
          </div>
          <div className='flex justify-between gap-3'>
            <span className='text-muted-foreground'>Session</span>
            <span className='font-medium'>
              {formatDate(booking?.start_time)} · {formatTimeRange(booking?.start_time, booking?.end_time)}
            </span>
          </div>
          <div className='flex justify-between gap-3'>
            <span className='text-muted-foreground'>Amount to request</span>
            <span className='font-semibold'>
              {formatMoney(booking?.price_amount, booking?.currency ?? 'KES')}
            </span>
          </div>
          <div className='flex justify-between gap-3'>
            <span className='text-muted-foreground'>Payment engine</span>
            <span className='font-medium capitalize'>
              {booking?.payment_engine?.replace('-', ' ') ?? 'mpesa'}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={busy}>
            {busy ? 'Sending…' : 'Accept & request payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeclineDialog({
  booking,
  studentName,
  declineBooking,
  cancelBooking,
  onClose,
  onDone,
}: {
  booking: BookingResponse | null;
  studentName: string;
  declineBooking: ReturnType<typeof useMutation>;
  cancelBooking: ReturnType<typeof useMutation>;
  onClose: () => void;
  onDone: (booking: BookingResponse | null) => void | Promise<void>;
}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (!booking) return;
    setBusy(true);
    try {
      // NOTE: the decline/cancel endpoints currently take no body. If the API
      // is extended to accept a reason, pass `body: { reason: reason.trim() }` below.
      await declineBooking.mutateAsync({ path: { bookingUuid: booking.uuid } });
      await cancelBooking.mutateAsync({ path: { bookingUuid: booking.uuid } });
      await onDone(booking);
      toast.success('Booking declined and cancelled', { description: studentName });
      setReason('');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not decline and cancel this booking.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!booking} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Decline & cancel booking</DialogTitle>
          <DialogDescription>
            Let {studentName || 'the student'} know why so they can rebook at a better time.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-1.5'>
          <label className='text-xs text-muted-foreground'>Reason (optional)</label>
          <Textarea
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder='e.g. These times clash with my Grade 3 class.'
          />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={busy}>
            Keep request
          </Button>
          <Button variant='destructive' onClick={confirm} disabled={busy}>
            {busy ? 'Cancelling…' : 'Decline & cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default InstructorBookingRequestsPage;