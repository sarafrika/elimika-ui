'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@tanstack/react-query';
import { Calendar, Clock, Eye, Star, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cancelBookingMutation } from '../../../services/client/@tanstack/react-query.gen';

type Props = {
  bookings: any[];
  instructors: any[];
  refetchBookings: any;
  onBookingUpdate: (booking: any) => void;
};

export const ManageBookings: React.FC<Props> = ({ bookings, instructors, onBookingUpdate, refetchBookings }) => {
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');


  const getInstructor = (instructorId: string) => {
    return instructors.find(i => i.uuid === instructorId);
  };

  const getStatusColor = (status: any['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-600';
      case 'pending':
        return 'bg-yellow-600';
      case 'declined':
        return 'bg-red-600';
      case 'cancelled':
        return 'bg-gray-600';
      case 'completed':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };


  const cancelBooking = useMutation(cancelBookingMutation())
  const handleCancelBooking = () => {
    if (!selectedBooking) return;

    cancelBooking.mutate({ path: { bookingUuid: selectedBooking.uuid } }, {
      onSuccess: (data) => {
        toast.success('Booking cancelled successfully');

        refetchBookings();

        const updatedBooking: any = {
          ...selectedBooking,
          status: 'cancelled',
          notes: cancelReason,
        };

        onBookingUpdate(updatedBooking);
        setShowCancelDialog(false);
        setSelectedBooking(null);
        setCancelReason('');
      },
      onError: (error: any) => {
        toast.error(`Failed to cancel booking: ${error.message}`);
      }
    });
  };

  const handleSubmitFeedback = () => {
    if (!selectedBooking) return;

    toast.success(`Feedback submitted!\nRating: ${feedbackRating}/5\nComment: ${feedbackComment}`);

    setShowFeedbackDialog(false);
    setSelectedBooking(null);
    setFeedbackRating(5);
    setFeedbackComment('');
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


  // "cancelled" | "expired" | "confirmed" | "payment_required" | "payment_failed"

  const renderBookingCard = (booking: any) => {
    const instructor = instructors.find(
      i => i.uuid === booking.instructor_uuid
    );

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
          {!isPastBooking && booking.status !== 'cancelled' && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full sm:w-auto gap-2"
              onClick={() => {
                setSelectedBooking(booking);
                setShowCancelDialog(true);
              }}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto gap-2"
            onClick={() => setSelectedBooking(booking)}
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>

          {!isPastBooking && !booking?.payment_reference && (
            <Button
              className="w-full sm:w-auto gap-2"
              onClick={() => toast.success('Activate payment')}
            >
              Pay {booking.currency} {booking.price_amount}
            </Button>
          )}

          {booking.status === 'completed' && (
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto gap-2"
              onClick={() => {
                setSelectedBooking(booking);
                setShowFeedbackDialog(true);
              }}
            >
              <Star className="h-4 w-4" />
              Rate
            </Button>
          )}
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
      {selectedBooking && !showCancelDialog && !showFeedbackDialog && (
        <Dialog open={true} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>Booking ID: {selectedBooking?.uuid}</DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              {/* Instructor Info */}
              <Card className='p-4'>
                {(() => {
                  const instructor = getInstructor(selectedBooking?.instructor_uuid);

                  return instructor ? (
                    <div className='flex items-center gap-4'>
                      <Avatar className='h-12 w-12'>
                        <AvatarImage
                          // src={instructor?.profileImage}
                          alt={instructor?.full_name}
                        />
                        <AvatarFallback>{instructor?.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p>{instructor?.full_name}</p>
                        <p className='text-muted-foreground text-sm'>
                          {instructor?.professional_headline}
                        </p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </Card>

              {/* All Sessions */}
              <div>
                <Label className="mb-3 block">Session</Label>

                {selectedBooking && (
                  <Card className="bg-muted p-4">
                    <div className="space-y-2">
                      {/* Date */}
                      <div className="flex items-center gap-2">
                        <Calendar className="text-muted-foreground h-4 w-4" />
                        <p>
                          {new Date(selectedBooking.start_time).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-2">
                        <Clock className="text-muted-foreground h-4 w-4" />
                        <p className="text-muted-foreground text-sm">
                          {new Date(selectedBooking.start_time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' - '}
                          {new Date(selectedBooking.end_time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>


              {/* Payment Info */}
              <Card className='p-4'>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Payment Method</span>
                    <span className='capitalize'>
                      {selectedBooking.payment_engine?.replace('-', ' ')}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Payment Status</span>
                    <Badge
                      variant={
                        selectedBooking.paymentStatus === 'completed' ? 'default' : 'secondary'
                      }
                    >
                      {selectedBooking.payment_session_id}
                    </Badge>
                  </div>
                  <div className='flex justify-between'>
                    <span>Total Amount</span>
                    <span className='text-xl'>
                      {selectedBooking.currency} ${selectedBooking.price_amount}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            <DialogFooter>
              <Button onClick={() => setSelectedBooking(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
            <DialogDescription>
              Help others by sharing your experience with this instructor
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div>
              <Label>Rating</Label>
              <div className='mt-2 flex items-center gap-4'>
                <Slider
                  value={[feedbackRating]}
                  onValueChange={value => setFeedbackRating(value[0] as number)}
                  max={5}
                  step={1}
                  className='flex-1'
                />
                <div className='flex items-center gap-1'>
                  <Star className='h-5 w-5 fill-yellow-500 text-yellow-500' />
                  <span className='w-8 text-xl'>{feedbackRating}</span>
                </div>
              </div>
            </div>

            <div>
              <Label>Your Feedback</Label>
              <Textarea
                placeholder='Share your experience...'
                value={feedbackComment}
                onChange={e => setFeedbackComment(e.target.value)}
                className='mt-2'
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setShowFeedbackDialog(false);
                setFeedbackRating(5);
                setFeedbackComment('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitFeedback}>Submit Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
