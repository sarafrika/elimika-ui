'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  cancelBookingMutation,
  getAllInstructorsOptions,
  requestPaymentMutation,
  submitInstructorReviewMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Eye, Star, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCountdown } from '../../../hooks/use-countdown';
import { BookingDetailsModal } from './booking-details-modal';
import { FeedbackDialog } from './review-instructor-modal';

// "cancelled" | "expired" | "confirmed" | "payment_required" | "payment_failed"
export const getStatusColor = (status?: any): string => {
  switch (status) {
    case 'confirmed':
      return 'bg-success';
    case 'payment_required':
      return 'bg-primary';
    case 'payment_failed':
      return 'bg-destructive';
    case 'expired':
      return 'bg-muted-foreground';
    case 'cancelled':
      return 'bg-destructive';
    default:
      return 'bg-muted-foreground';
  }
};

type Props = {
  bookings: any[];
  instructors: any[];
  refetchBookings: any;
  onBookingUpdate: (booking: any) => void;
};

export const ManageBookings: React.FC<Props> = ({
  bookings,
  instructors,
  onBookingUpdate,
  refetchBookings,
}) => {
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [openBookingDetails, setOpenBookingDetails] = useState(false);

  const [cancelReason, setCancelReason] = useState('');
  const [rating, setRating] = useState(0);
  const [clarityRating, setClarityRating] = useState(0);
  const [engagementRating, setEngagementRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [headline, setHeadline] = useState('');

  const { data } = useQuery(
    getAllInstructorsOptions({
      query: { pageable: {} },
    })
  );

  const cancelBooking = useMutation(cancelBookingMutation());
  const handleCancelBooking = () => {
    if (!selectedBooking) return;

    cancelBooking.mutate(
      { path: { bookingUuid: selectedBooking.uuid } },
      {
        onSuccess: data => {
          toast.success('Booking cancelled successfully');

          refetchBookings();
          setShowCancelDialog(false);
          setSelectedBooking(null);
          setCancelReason('');
        },
        onError: (error: any) => {
          toast.error(`Failed to cancel booking: ${error.message}`);
        },
      }
    );
  };

  const payBooking = useMutation(requestPaymentMutation());
  const handlePayBooking = (booking: any) => {
    payBooking.mutate(
      { path: { bookingUuid: booking.uuid } },
      {
        onSuccess: data => {
          if (data?.data?.payment_url) {
            window.location.href = data.data.payment_url;
          } else {
            toast.error('Payment URL not found');
          }
        },
        onError: (error: any) => {
          toast.error(`Failed to initiate payment: ${error.message}`);
        },
      }
    );
  };

  const reviewInstructor = useMutation(submitInstructorReviewMutation());
  const handleSubmitFeedback = () => {
    if (!selectedBooking) return;

    reviewInstructor.mutate(
      {
        body: {
          enrollment_uuid: '',
          instructor_uuid: selectedBooking?.instructor_uuid,
          student_uuid: selectedBooking?.student_uuid,
          comments: feedbackComment as string,
          headline: headline,
          is_anonymous: false,
          rating: rating,
          clarity_rating: clarityRating,
          engagement_rating: engagementRating,
          punctuality_rating: punctualityRating,
        },
        path: { instructorUuid: selectedBooking?.instructor_uuid },
      },
      {
        onSuccess: data => {
          toast.success(data?.message);
          setShowFeedbackDialog(false);
          setSelectedBooking(null);
          setFeedbackComment('');
        },
        onError: data => {
          toast.error(data?.message);
        },
      }
    );
  };

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
    const countdown = useCountdown(booking.hold_expires_at);

    const instructor = data?.data?.content?.find(i => i.uuid === booking.instructor_uuid);

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

              <div>
                {booking.status === 'payment_required' && (
                  <span className='text-muted-foreground text-sm'>
                    {`Payment expires in ${countdown?.hours}h ${String(countdown?.minutes).padStart(2, '0')}m ${String(countdown?.seconds).padStart(2, '0')}s`}
                  </span>
                )}
              </div>
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
          {!isPastBooking && booking.status !== 'cancelled' && (
            <Button
              variant='destructive'
              size='sm'
              className='w-full gap-2 sm:w-auto'
              onClick={() => {
                setSelectedBooking(booking);
                setShowCancelDialog(true);
              }}
            >
              <X className='h-4 w-4' />
              Cancel
            </Button>
          )}

          <Button
            variant='outline'
            size='sm'
            className='w-full gap-2 sm:w-auto'
            onClick={() => {
              setSelectedBooking(booking);
              setOpenBookingDetails(true);
            }}
          >
            <Eye className='h-4 w-4' />
            View Details
          </Button>

          {!isPastBooking && !booking?.payment_reference && (
            <Button className='w-full gap-2 sm:w-auto' onClick={() => handlePayBooking(booking)}>
              Pay {booking.currency} {booking.price_amount}
            </Button>
          )}

          <Button
            variant='outline'
            size='sm'
            className='w-full gap-2 sm:w-auto'
            onClick={() => {
              setOpenBookingDetails(false);
              setSelectedBooking(booking);
              setShowFeedbackDialog(true);
            }}
          >
            <Star className='h-4 w-4' />
            Rate
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className='space-y-6'>
      {bookings?.length === 0 ? (
        <Card className='p-12 text-center'>
          <Calendar className='text-muted-foreground mx-auto mb-4 h-16 w-16' />
          <h3>No bookings yet</h3>
          <p className='text-muted-foreground mt-2'>
            Start by browsing instructors and booking your first session
          </p>
        </Card>
      ) : (
        <Tabs defaultValue='upcoming'>
          <TabsList>
            <TabsTrigger value='upcoming'>Upcoming ({upcomingBookings?.length})</TabsTrigger>
            <TabsTrigger value='past'>Past ({pastBookings?.length})</TabsTrigger>
          </TabsList>

          <TabsContent value='upcoming' className='mt-6 space-y-4'>
            {upcomingBookings?.length === 0 ? (
              <Card className='p-12 text-center'>
                <Calendar className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                <p className='text-muted-foreground'>No upcoming bookings</p>
              </Card>
            ) : (
              upcomingBookings?.map(renderBookingCard)
            )}
          </TabsContent>

          <TabsContent value='past' className='mt-6 space-y-4'>
            {pastBookings?.length === 0 ? (
              <Card className='p-12 text-center'>
                <Calendar className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                <p className='text-muted-foreground'>No past bookings</p>
              </Card>
            ) : (
              pastBookings?.map(renderBookingCard)
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Booking Details Dialog */}
      {openBookingDetails && (
        <BookingDetailsModal
          booking={selectedBooking}
          open={openBookingDetails}
          onClose={() => setSelectedBooking(null)}
          instructors={instructors}
        />
      )}

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div>
            <Label>Reason for cancellation (optional)</Label>
            <Textarea
              placeholder="Let us know why you're cancelling..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className='mt-2'
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setShowCancelDialog(false);
                setCancelReason('');
              }}
            >
              Keep Booking
            </Button>
            <Button variant='destructive' onClick={handleCancelBooking}>
              {cancelBooking.isPending ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
        headline={headline}
        onHeadlineChange={setHeadline}
        feedback={feedbackComment}
        onFeedbackChange={setFeedbackComment}
        rating={rating}
        onRatingChange={setRating}
        clarityRating={clarityRating}
        onClarityRatingChange={setClarityRating}
        engagementRating={engagementRating}
        onEngagementRatingChange={setEngagementRating}
        punctualityRating={punctualityRating}
        onPunctualityRatingChange={setPunctualityRating}
        isSubmitting={reviewInstructor.isPending}
        onSubmit={handleSubmitFeedback}
      />
    </div>
  );
};
