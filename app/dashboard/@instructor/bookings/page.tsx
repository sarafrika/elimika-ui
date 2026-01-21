'use client';

import ConfirmModal from '@/components/custom-modals/confirm-modal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { useInstructor } from '@/context/instructor-context';
import {
  acceptBookingMutation,
  declineBookingMutation,
  getCourseByUuidOptions,
  getInstructorBookingsOptions,
  getInstructorBookingsQueryKey,
  getStudentByIdOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Eye, FilterIcon, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BookingDetailsModal } from '../../_components/booking-details-modal';
import { getStatusColor } from '../../_components/manage-bookings';

function BookingsPage() {
  const instructor = useInstructor();
  const qc = useQueryClient();
  const acceptBooking = useMutation(acceptBookingMutation());
  const declineBooking = useMutation(declineBookingMutation());

  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past'>('all');

  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [openAcceptModal, setOpenAcceptModal] = useState(false);
  const [openDeclineModal, setOpenDeclineModal] = useState(false);

  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 15;

  const bookingsQuery = useQuery({
    ...getInstructorBookingsOptions({
      path: { instructorUuid: instructor?.uuid! },
      query: {
        status: statusFilter === 'all' ? '' : statusFilter,
        pageable: { page: Math.max(0, page - 1), size: PAGE_SIZE },
      },
    }),
    enabled: !!instructor?.uuid,
  });

  const { data, isLoading, isError } = bookingsQuery;

  const bookings: any[] = useMemo(() => data?.data?.content ?? [], [data]);
  const pastBookings = bookings?.filter(b => {
    const isPastDate = new Date(b.start_time) < new Date();
    const isPastStatus = ['completed', 'cancelled'].includes(b.status);

    return isPastDate || isPastStatus;
  });

  const upcomingBookings = bookings?.filter(b => {
    const isFutureDate = new Date(b.start_time) >= new Date();
    const notCancelled = b.status !== 'cancelled';

    return isFutureDate && notCancelled;
  });

  const totalElements = bookings?.length ?? 0;
  const totalPages =
    data?.data?.metadata?.totalPages ?? (totalElements ? Math.ceil(totalElements / PAGE_SIZE) : 1);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<any | null>(null);

  // Fetch student and course details for the selected booking (lazy)
  const { data: studentQueryData } = useQuery({
    ...getStudentByIdOptions({ path: { uuid: selected?.student_uuid ?? '' } }),
    enabled: !!selected?.student_uuid,
  });

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: selected?.course_uuid ?? '' } }),
    enabled: !!selected?.course_uuid,
  });

  const filtered = useMemo(
    () =>
      bookings
        .filter(b =>
          `${b?.student_uuid ?? ''} ${b?.course_uuid ?? ''} ${b?.purpose ?? ''}`
            .toLowerCase()
            .includes(query.toLowerCase())
        )
        .filter(b => (statusFilter === 'all' ? true : b?.status === statusFilter)),
    [bookings, query, statusFilter]
  );

  useEffect(() => {
    if (filtered.length > 0 && !selected) {
      setSelected(filtered[0]);
    }
  }, [filtered, selected]);

  const handlePrev = () => setPage(p => Math.max(1, p - 1));
  const handleNext = () => setPage(p => Math.min(totalPages, p + 1));

  const handleAcceptBooking = () => {
    acceptBooking.mutate(
      { path: { bookingUuid: selected.uuid } },
      {
        onSuccess: data => {
          qc.invalidateQueries({
            queryKey: getInstructorBookingsQueryKey({
              path: { instructorUuid: instructor?.uuid! },
              query: { pageable: { page: Math.max(0, page - 1), size: PAGE_SIZE } },
            }),
          });
          toast.success(data?.message || `Accepted booking ${selected.uuid}`);
          setOpenAcceptModal(false);
        },
      }
    );
  };

  const handleDeclineBooking = () => {
    declineBooking.mutate(
      { path: { bookingUuid: selected.uuid } },
      {
        onSuccess: data => {
          qc.invalidateQueries({
            queryKey: getInstructorBookingsQueryKey({
              path: { instructorUuid: instructor?.uuid! },
              query: { pageable: { page: Math.max(0, page - 1), size: PAGE_SIZE } },
            }),
          });
          toast.success(data?.message || `Accepted booking ${selected.uuid}`);
          setOpenDeclineModal(false);
        },
      }
    );
  };

  const renderBookingCard = (booking: any) => {
    if (!instructor) return null;

    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);

    const now = new Date();

    const isPastBooking =
      new Date(booking.start_time) < now || ['completed', 'cancelled'].includes(booking.status);

    return (
      <Card key={booking.uuid} className='max-w-3xl p-4 sm:p-6'>
        {/* Header */}
        <div className='mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          {/* Instructor */}
          <div className='flex items-start gap-3'>
            <Avatar className='h-10 w-10 sm:h-12 sm:w-12'>
              <AvatarFallback>{instructor.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>

            <div>
              <h4 className='text-sm font-medium sm:text-base'>{instructor.full_name}</h4>
              <p className='text-muted-foreground text-xs sm:text-sm'>
                {instructor.professional_headline}
              </p>

              <Badge className={`mt-2 ${getStatusColor(booking.status)}`}>{booking.status}</Badge>
            </div>
          </div>

          {/* Price */}
          <div className='text-left sm:text-right'>
            <p className='text-lg font-semibold sm:text-xl'>
              {booking.currency} {booking.price_amount}
            </p>
            <p className='text-muted-foreground text-xs sm:text-sm'>1 session</p>
          </div>
        </div>

        {/* Info Section */}
        <div className='mb-4 flex flex-col gap-4 sm:flex-row sm:justify-between'>
          {/* Session Info */}
          <div className='space-y-2 text-sm'>
            <div className='flex items-center gap-2'>
              <Calendar className='text-muted-foreground h-4 w-4' />
              <span>
                {start.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className='flex items-center gap-2'>
              <Clock className='text-muted-foreground h-4 w-4' />
              <span>
                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className='flex items-center gap-2'>
              <span>Note: {booking?.purpose}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className='space-y-1 text-sm'>
            <div className='flex justify-between sm:justify-start sm:gap-2'>
              <span className='font-medium'>Payment:</span>
              <span>{booking?.payment_engine}</span>
            </div>

            <div className='flex justify-between sm:justify-start sm:gap-2'>
              <span className='font-medium'>Status:</span>
              <span>{booking?.payment_reference ? 'Paid' : 'Pending'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end'>
          <Button
            variant='outline'
            size='sm'
            className='w-full gap-2 sm:w-auto'
            onClick={() => setSelectedBooking(booking)}
          >
            <Eye className='h-4 w-4' />
            View Details
          </Button>
        </div>
      </Card>
    );
  };

  const studentUuids = useMemo(() => {
    return Array.from(new Set(bookings.map(b => b.student_uuid).filter(Boolean)));
  }, [bookings]);

  const studentQueries = useQueries({
    queries: studentUuids.map(uuid => ({
      ...getStudentByIdOptions({ path: { uuid } }),
    })),
  });

  const studentsById = useMemo(() => {
    const map: Record<string, any> = {};
    studentQueries.forEach(q => {
      // @ts-ignore
      const student = q.data?.data;
      if (student?.uuid) {
        map[student.uuid] = student;
      }
    });
    return map;
  }, [studentQueries]);

  return (
    <div className='space-y-6 pb-10'>
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value='all'>All ({bookings?.length})</TabsTrigger>
          <TabsTrigger value='upcoming'>Upcoming ({upcomingBookings.length})</TabsTrigger>
          <TabsTrigger value='past'>Past ({pastBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value='all' className='pt-4'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            {/* LEFT: Booking list */}
            <Card className='col-span-1 p-3 max-w-[400px]'>
              <div className='space-y-4'>
                {/* Search */}
                <div className='flex gap-2'>
                  <div className='relative w-full'>
                    <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                    <Input
                      placeholder='Search by student id, course id or purpose…'
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      className='pl-9'
                    />
                  </div>

                  <div className='flex items-center gap-2'>
                    <Select
                      value={statusFilter}
                      onValueChange={value => {
                        setStatusFilter(value);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className='flex w-[140px] items-center gap-0.5'>
                        <FilterIcon className='text-muted-foreground h-4 w-4' />
                        <SelectValue placeholder='Filter status' />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value='all'>All</SelectItem>
                        <SelectItem value='pending'>Pending</SelectItem>
                        <SelectItem value='confirmed'>Confirmed</SelectItem>
                        <SelectItem value='payment_required'>Payment Required</SelectItem>
                        <SelectItem value='payment_failed'>Payment Failed</SelectItem>
                        <SelectItem value='expired'>Expired</SelectItem>
                        <SelectItem value='cancelled'>Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* <Button variant='outline' size='sm' onClick={() => setQuery('')}>
                    Clear
                  </Button> */}
                </div>

                <div className='text-muted-foreground text-xs'>
                  Showing {filtered.length} of {totalElements}
                </div>

                <Separator />

                {/* List */}
                <div className='max-h-[56vh] space-y-1 overflow-y-auto pr-1'>
                  {isLoading && (
                    <div className='text-muted-foreground py-8 text-center text-sm'>
                      Loading bookings…
                    </div>
                  )}

                  {isError && (
                    <div className='text-destructive py-8 text-center text-sm'>
                      Failed to load bookings
                    </div>
                  )}

                  {!isLoading && filtered.length === 0 && (
                    <div className='text-muted-foreground py-8 text-center text-sm'>
                      No bookings found
                    </div>
                  )}

                  {filtered.map(b => {
                    const key = b?.uuid ?? b?.id;
                    const isActive = selected?.uuid === b?.uuid;

                    const start = new Date(b.start_time);
                    const end = new Date(b.end_time);

                    const student = studentsById[b.student_uuid];

                    return (
                      <button
                        key={key}
                        onClick={() => setSelected(b)}
                        className={`group w-full rounded-md border p-3 text-left transition ${isActive ? 'border-primary bg-primary/5' : 'hover:border-border hover:bg-muted/40 border-transparent'} `}
                      >
                        <div className='text-foreground text-sm font-medium'>
                          {`${String(b?.uuid ?? 'Unknown').slice(0, 16)}...`}
                        </div>

                        <div className='flex items-center justify-between'>
                          <div className='text-sm font-medium'>
                            {student?.full_name ?? b.student_uuid.slice(0, 8)}
                          </div>

                          <Badge
                            variant='secondary'
                            className={`text-xs text-white capitalize ${getStatusColor(b?.status)}`}
                          >
                            {b?.status?.replace('_', ' ') ?? 'pending'}
                          </Badge>
                        </div>

                        <div className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
                          {b?.purpose ?? 'No purpose provided'}
                        </div>

                        <div className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
                          {start.toLocaleDateString()}
                        </div>

                        <div className='text-muted-foreground mt-1 line-clamp-2 text-sm font-bold'>
                          {b?.currency} {b?.price_amount}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className='mt-3 flex items-center justify-between'>
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
              </div>
            </Card>

            {/* RIGHT: Booking details */}
            <Card className='col-span-1 min-h-[240px] p-5 sm:col-span-2'>
              {!selected ? (
                <div className='flex h-full flex-col items-center justify-center space-y-2 text-center'>
                  <h3 className='text-foreground text-lg font-medium'>Select a booking</h3>
                  <p className='text-muted-foreground max-w-sm text-sm'>
                    Choose a booking from the list to view details and take action.
                  </p>
                </div>
              ) : (
                <div className='space-y-5'>
                  {/* Header */}
                  <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
                    <div>
                      <h2 className='text-foreground text-lg font-semibold'>
                        {/* @ts-ignore */}
                        {studentQueryData?.data?.full_name ??
                          studentQueryData?.data?.full_name ??
                          selected?.student_uuid?.slice(0, 8) ??
                          'Unknown student'}
                      </h2>
                      <p className='text-muted-foreground text-sm'>{'No contact info'}</p>

                      <div className='text-muted-foreground mt-2 text-sm'>
                        Course: {courseQuery.data?.data?.name ?? selected?.course_uuid?.slice(0, 8)}
                      </div>
                    </div>

                    <div className='text-muted-foreground text-right text-sm'>
                      <div>Booked on</div>
                      <div className='text-foreground font-medium'>
                        {new Date(
                          selected?.created_date ?? selected?.created_at ?? Date.now()
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Details */}
                  <div className='bg-background space-y-4 rounded-lg p-4'>
                    <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                      <h4 className='text-foreground text-lg font-semibold'>Booking Details</h4>
                      <Badge
                        variant={
                          selected?.status === 'payment_required' ? 'destructive' : 'secondary'
                        }
                        className='capitalize'
                      >
                        {selected?.status?.replace('_', ' ') ?? 'pending'}
                      </Badge>
                    </div>

                    <Separator />

                    <div className='text-muted-foreground text-sm'>
                      <span className='text-foreground font-medium'>Purpose:</span>{' '}
                      {selected?.purpose ?? 'No additional details provided'}
                    </div>

                    <div className='text-muted-foreground mt-2 grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <span className='text-foreground font-medium'>Start:</span>{' '}
                        {selected?.start_time
                          ? new Date(selected.start_time).toLocaleString()
                          : '—'}
                      </div>
                      <div>
                        <span className='text-foreground font-medium'>End:</span>{' '}
                        {selected?.end_time ? new Date(selected.end_time).toLocaleString() : '—'}
                      </div>
                    </div>

                    <div className='text-muted-foreground mt-2 grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <span className='text-foreground font-medium'>Price:</span>{' '}
                        {selected?.currency ?? 'KES'} {selected?.price_amount ?? '—'}
                      </div>
                      <div>
                        <span className='text-foreground font-medium'>Payment Engine:</span>{' '}
                        {selected?.payment_engine ?? '—'}
                      </div>
                    </div>

                    {selected?.hold_expires_at && (
                      <div className='text-muted-foreground mt-3 text-sm'>
                        <span className='text-foreground font-medium'>Hold Expires:</span>{' '}
                        {new Date(selected.hold_expires_at).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className='flex flex-col justify-end gap-2 self-end sm:flex-row'>
                    <Button
                      onClick={() => {
                        setSelected(selected), setOpenAcceptModal(true);
                      }}
                      className='w-full sm:w-auto'
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => {
                        setSelected(selected), setOpenDeclineModal(true);
                      }}
                      variant='destructive'
                      className='w-full sm:w-auto'
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='upcoming' className='pt-4'>
          <div className='grid grid-cols-1 gap-4'>
            <Card className='p-4'>
              <h3 className='text-foreground text-lg font-medium'>Upcoming bookings</h3>

              <div className='flex flex-col gap-4 p-3'>
                {upcomingBookings?.length === 0 ? (
                  <Card className='p-12 text-center'>
                    <Calendar className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                    <p className='text-muted-foreground'>No upcoming bookings</p>
                  </Card>
                ) : (
                  upcomingBookings?.map(renderBookingCard)
                )}{' '}
              </div>
            </Card>


          </div>
        </TabsContent>

        <TabsContent value='past' className='pt-4'>
          <div className='grid grid-cols-1 gap-4'>
            <Card className='p-4'>
              <p className='text-foreground text-lg font-medium'>Past bookings</p>

              <div className='flex flex-col gap-4 p-3'>
                {pastBookings?.length === 0 ? (
                  <Card className='p-12 text-center'>
                    <Calendar className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                    <p className='text-muted-foreground'>No past bookings</p>
                  </Card>
                ) : (
                  pastBookings?.map(renderBookingCard)
                )}{' '}
              </div>
            </Card>


          </div>
        </TabsContent>
      </Tabs>

      {/* Booking Details Dialog */}
      {selectedBooking && (
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
        title='Confirm Booking'
        description='Are you sure you want to accept booking for this class or program? Please review the details before confirming.'
        onConfirm={handleAcceptBooking}
        isLoading={acceptBooking.isPending}
        confirmText='Yes, Confirm'
        cancelText='No, Cancel'
        variant='destructive'
      />

      <ConfirmModal
        open={openDeclineModal}
        setOpen={setOpenDeclineModal}
        title='Decline Booking'
        description='Are you sure you want to decline this booking request? This action cannot be undone.'
        onConfirm={handleDeclineBooking}
        isLoading={declineBooking.isPending}
        confirmText='Yes, Decline'
        cancelText='No, Keep Booking'
        variant='destructive'
      />
    </div>
  );
}

export default BookingsPage;
