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
import { Calendar, Clock, Eye, MapPin, Star, Video, X } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Booking } from '../browse-courses/instructor/[id]/page';

type Props = {
  bookings: any[];
  instructors: any[];
  onBookingUpdate: (booking: Booking) => void;
};

export const ManageBookings: React.FC<Props> = ({ bookings, instructors, onBookingUpdate }) => {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  const getInstructor = (instructorId: string) => {
    return instructors.find(i => i.id === instructorId);
  };

  const getStatusColor = (status: Booking['status']) => {
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

  const handleCancelBooking = () => {
    if (!selectedBooking) return;

    const updatedBooking: Booking = {
      ...selectedBooking,
      status: 'cancelled',
      notes: cancelReason,
    };

    onBookingUpdate(updatedBooking);
    setShowCancelDialog(false);
    setSelectedBooking(null);
    setCancelReason('');
  };

  const handleSubmitFeedback = () => {
    if (!selectedBooking) return;

    toast.success(`Feedback submitted!\nRating: ${feedbackRating}/5\nComment: ${feedbackComment}`);

    setShowFeedbackDialog(false);
    setSelectedBooking(null);
    setFeedbackRating(5);
    setFeedbackComment('');
  };

  const upcomingBookings = bookings?.filter(
    b =>
      (b.status === 'confirmed' || b.status === 'pending') &&
      b.slots.some((s: any) => s.date >= new Date())
  );

  const pastBookings = bookings?.filter(
    b =>
      b.status === 'completed' ||
      b.status === 'cancelled' ||
      b.slots.every((s: any) => s.date < new Date())
  );

  const renderBookingCard = (booking: Booking) => {
    const instructor = instructors[0];
    // const instructor = getInstructor(booking?.instructorId);
    if (!instructor) return null;

    const firstSlot = booking.slots[0];

    return (
      <Card key={booking.id} className='p-6'>
        <div className='mb-4 flex items-start justify-between'>
          <div className='flex items-start gap-4'>
            <Avatar className='h-12 w-12'>
              {/* <AvatarImage src={instructor.profileImage} alt={instructor.name} /> */}
              <AvatarFallback>{instructor?.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h4>{instructor?.full_name}</h4>
              <p className='text-muted-foreground text-sm'>{instructor?.professional_headline}</p>
              <Badge className={`mt-2 ${getStatusColor(booking.status)}`}>{booking.status}</Badge>
            </div>
          </div>
          <div className='text-right'>
            <p className='text-xl'>
              {booking.currency} ${booking.totalFee}
            </p>
            <p className='text-muted-foreground text-sm'>
              {booking.totalSessions} {booking.totalSessions === 1 ? 'session' : 'sessions'}
            </p>
          </div>
        </div>

        <div className='mb-4 space-y-2'>
          <div className='flex items-center gap-2 text-sm'>
            <Calendar className='text-muted-foreground h-4 w-4' />
            <span>
              {firstSlot?.date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
              {booking.slots.length > 1 && ` +${booking.slots.length - 1} more`}
            </span>
          </div>
          <div className='flex items-center gap-2 text-sm'>
            <Clock className='text-muted-foreground h-4 w-4' />
            <span>
              {firstSlot?.startTime} - {firstSlot?.endTime}
            </span>
          </div>
          <div className='flex items-center gap-2 text-sm'>
            {firstSlot?.mode === 'online' ? (
              <>
                <Video className='text-muted-foreground h-4 w-4' />
                <span>Online Session</span>
              </>
            ) : (
              <>
                <MapPin className='text-muted-foreground h-4 w-4' />
                <span>{firstSlot?.venue || 'Onsite'}</span>
              </>
            )}
          </div>
        </div>

        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            className='flex-1 gap-2'
            onClick={() => setSelectedBooking(booking)}
          >
            <Eye className='h-4 w-4' />
            View Details
          </Button>

          {booking.status === 'confirmed' && (
            <Button
              variant='outline'
              size='sm'
              className='gap-2'
              onClick={() => {
                setSelectedBooking(booking);
                setShowCancelDialog(true);
              }}
            >
              <X className='h-4 w-4' />
              Cancel
            </Button>
          )}

          {booking.status === 'completed' && (
            <Button
              variant='outline'
              size='sm'
              className='gap-2'
              onClick={() => {
                setSelectedBooking(booking);
                setShowFeedbackDialog(true);
              }}
            >
              <Star className='h-4 w-4' />
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
              <DialogDescription>Booking ID: {selectedBooking?.id}</DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              {/* Instructor Info */}
              <Card className='p-4'>
                {(() => {
                  const instructor = instructors[0];
                  // const instructor = getInstructor(selectedBooking?.instructorId);

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
                <Label className='mb-3 block'>Sessions</Label>
                <div className='space-y-2'>
                  {selectedBooking?.slots?.map((slot: any, index: any) => (
                    <Card key={index} className='bg-muted p-4'>
                      <div className='space-y-2'>
                        <div className='flex items-center gap-2'>
                          <Calendar className='text-muted-foreground h-4 w-4' />
                          <p>
                            {slot.date.toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Clock className='text-muted-foreground h-4 w-4' />
                          <p className='text-muted-foreground text-sm'>
                            {slot.startTime} - {slot.endTime} ({slot.duration}h)
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Payment Info */}
              <Card className='p-4'>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Payment Method</span>
                    <span className='capitalize'>
                      {selectedBooking.paymentMethod?.replace('-', ' ')}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Payment Status</span>
                    <Badge
                      variant={
                        selectedBooking.paymentStatus === 'completed' ? 'default' : 'secondary'
                      }
                    >
                      {selectedBooking.paymentStatus}
                    </Badge>
                  </div>
                  <div className='flex justify-between'>
                    <span>Total Amount</span>
                    <span className='text-xl'>
                      {selectedBooking.currency} ${selectedBooking.totalFee}
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
