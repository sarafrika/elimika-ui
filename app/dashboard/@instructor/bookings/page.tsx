// ...existing code...
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInstructor } from '@/context/instructor-context';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Eye } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback } from '../../../../components/ui/avatar';
import {
  getCourseByUuidOptions,
  getInstructorBookingsOptions,
  getStudentByIdOptions,
} from '../../../../services/client/@tanstack/react-query.gen';
import { BookingDetailsModal } from '../../_components/booking-details-modal';
import { getStatusColor } from '../../_components/manage-bookings';

function BookingsPage() {
  const instructor = useInstructor();

  // Tabs: all / upcoming / past
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past'>('all');

  // Filters / pagination
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

  const totalElements = bookings?.length ?? 0;
  const totalPages =
    data?.data?.metadata?.totalPages ??
    (totalElements ? Math.ceil(totalElements / PAGE_SIZE) : 1);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<any | null>(null);

  // Fetch student and course details for the selected booking (lazy)
  const studentQuery = useQuery({
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

  const handlePrev = () => setPage(p => Math.max(1, p - 1));
  const handleNext = () => setPage(p => Math.min(totalPages, p + 1));

  //////////////////
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

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

  const renderBookingCard = (booking: any) => {
    if (!instructor) return null;

    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);

    const now = new Date();

    const isPastBooking =
      new Date(booking.start_time) < now ||
      ['completed', 'cancelled'].includes(booking.status);


    return (
      <Card
        key={booking.uuid}
        className="p-4 sm:p-6 max-w-3xl"
      >
        {/* Header */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Instructor */}
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
              <AvatarFallback>
                {instructor.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div>
              <h4 className="text-sm sm:text-base font-medium">
                {instructor.full_name}
              </h4>
              <p className="text-muted-foreground text-xs sm:text-sm">
                {instructor.professional_headline}
              </p>

              <Badge className={`mt-2 ${getStatusColor(booking.status)}`}>
                {booking.status}
              </Badge>
            </div>
          </div>

          {/* Price */}
          <div className="text-left sm:text-right">
            <p className="text-lg sm:text-xl font-semibold">
              {booking.currency} {booking.price_amount}
            </p>
            <p className="text-muted-foreground text-xs sm:text-sm">
              1 session
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:justify-between">
          {/* Session Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {start.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span>
                Note: {booking?.purpose}
              </span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between sm:justify-start sm:gap-2">
              <span className="font-medium">Payment:</span>
              <span>{booking?.payment_engine}</span>
            </div>

            <div className="flex justify-between sm:justify-start sm:gap-2">
              <span className="font-medium">Status:</span>
              <span>
                {booking?.payment_reference ? 'Paid' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:flex-wrap">


          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto gap-2"
            onClick={() => setSelectedBooking(booking)}
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </div>
      </Card>

    );
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bookings</h1>
          <p className="text-sm text-muted-foreground">Manage incoming booking requests</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-2 py-1 rounded-md text-sm bg-background border"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="payment_required">Payment Required</option>
            <option value="payment_failed">Payment Failed</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All ({bookings?.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* LEFT: Booking list */}
            <Card className="col-span-1 p-3">
              <div className="space-y-4">
                {/* Search */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by student id, course id or purpose…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <Button variant="outline" size="sm" onClick={() => setQuery('')}>
                    Clear
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Showing {filtered.length} of {totalElements}
                </div>

                <Separator />

                {/* List */}
                <div className="space-y-1 overflow-y-auto max-h-[56vh] pr-1">
                  {isLoading && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      Loading bookings…
                    </div>
                  )}

                  {isError && (
                    <div className="py-8 text-center text-sm text-destructive">
                      Failed to load bookings
                    </div>
                  )}

                  {!isLoading && filtered.length === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No bookings found
                    </div>
                  )}

                  {filtered.map((b) => {
                    const key = b?.uuid ?? b?.id;
                    const isActive = selected?.uuid === b?.uuid;

                    return (
                      <button
                        key={key}
                        onClick={() => setSelected(b)}
                        className={`
                          group w-full rounded-md border p-3 text-left transition
                          ${isActive ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border hover:bg-muted/40'}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm text-foreground">
                            {String(b?.student_uuid ?? b?.student_id ?? 'Unknown').slice(0, 8)}
                          </div>

                          <Badge
                            variant="secondary"
                            className={`text-xs capitalize text-white ${getStatusColor(b?.status)}`}
                          >
                            {b?.status?.replace('_', ' ') ?? 'pending'}
                          </Badge>
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {b?.purpose ?? 'No purpose provided'}
                        </div>

                        <div className="mt-2 text-[11px] text-muted-foreground">
                          {new Date(b?.created_date ?? b?.created_at ?? Date.now()).toLocaleDateString()}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-muted-foreground">Page {page} of {totalPages}</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handlePrev} disabled={page <= 1}>
                      Prev
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleNext} disabled={page >= totalPages}>
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* RIGHT: Booking details */}
            <Card className="col-span-1 sm:col-span-2 p-5 min-h-[240px]">
              {!selected ? (
                <div className="flex h-full flex-col items-center justify-center text-center space-y-2">
                  <h3 className="text-lg font-medium text-foreground">Select a booking</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Choose a booking from the list to view details and take action.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        {studentQuery.data?.full_name ??
                          studentQuery.data?.full_name ??
                          selected?.student_uuid?.slice(0, 8) ??
                          'Unknown student'}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {studentQuery.data?.full_name ?? 'No contact info'}
                      </p>

                      <div className="mt-2 text-sm text-muted-foreground">
                        Course: {courseQuery.data?.data?.name ?? selected?.course_uuid?.slice(0, 8)}
                      </div>
                    </div>

                    <div className="text-right text-sm text-muted-foreground">
                      <div>Booked on</div>
                      <div className="font-medium text-foreground">
                        {new Date(selected?.created_date ?? selected?.created_at ?? Date.now()).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Details */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Booking details</h4>
                    <p className="text-sm text-muted-foreground">
                      {selected?.purpose ?? 'No additional details provided'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-3">
                      <div>
                        <span className="font-medium text-foreground">Start:</span>{' '}
                        {selected?.start_time ? new Date(selected.start_time).toLocaleString() : '—'}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">End:</span>{' '}
                        {selected?.end_time ? new Date(selected.end_time).toLocaleString() : '—'}
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      <div>Price: {selected?.currency ?? 'KES'} {selected?.price_amount ?? '—'}</div>
                      <div>Payment engine: {selected?.payment_engine ?? '—'}</div>
                      <div>Hold expires: {selected?.hold_expires_at ? new Date(selected.hold_expires_at).toLocaleString() : '—'}</div>
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <div className="sm:ml-auto text-sm text-muted-foreground flex items-center">
                      Status:
                      <span className="ml-1 font-medium capitalize text-foreground">
                        {selected?.status ?? 'pending'}
                      </span>
                    </div>

                    <Button className="w-full sm:w-auto">Accept</Button>
                    <Button variant="destructive" className="w-full sm:w-auto">Reject</Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="pt-4">
          <div className="grid grid-cols-1 gap-4">
            <Card className="p-4">
              <h3 className="text-lg font-medium text-foreground">Upcoming bookings</h3>
              <p className="text-sm text-muted-foreground">
                Placeholder UI for upcoming bookings. You can update this panel with the UI you want to show for future sessions.
              </p>
            </Card>

            {/* Optionally show a compact list */}
            <div className="flex flex-col p-3 gap-4">
              {upcomingBookings?.length === 0 ? (
                <Card className='p-12 text-center'>
                  <Calendar className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                  <p className='text-muted-foreground'>No upcoming bookings</p>
                </Card>
              ) : (
                upcomingBookings?.map(renderBookingCard)
              )}            </div>
          </div>
        </TabsContent>

        <TabsContent value="past" className="pt-4">
          <div className="grid grid-cols-1 gap-4">
            <Card className="p-4">
              <p className="text-lg font-medium text-foreground">Past bookings</p>
              <p className="text-sm text-muted-foreground">
                Placeholder UI for past bookings. Replace with the desired historical view, reports, or exports.
              </p>
            </Card>

            <div className="flex flex-col p-3 gap-4">
              {pastBookings?.length === 0 ? (
                <Card className='p-12 text-center'>
                  <Calendar className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                  <p className='text-muted-foreground'>No past bookings</p>
                </Card>
              ) : (
                pastBookings?.map(renderBookingCard)
              )}            </div>
          </div>
        </TabsContent>
      </Tabs>


      {/* Booking Details Dialog */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          open={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          instructors={[instructor]} />
      )}
    </div>
  );
}

export default BookingsPage;
// ...existing code...