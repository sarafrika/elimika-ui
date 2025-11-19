import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, CheckCircle, Clock, Download, Mail, MapPin, Share2, Video } from 'lucide-react';
import type React from 'react';
import type { Booking, Instructor } from '../browse-courses/instructor/page';

type Props = {
  booking: Booking;
  instructor: Instructor;
  onClose: () => void;
};

export const BookingConfirmation: React.FC<Props> = ({ booking, instructor, onClose }) => {
  const handleDownloadReceipt = () => {
    // In a real app, this would generate and download a PDF receipt
    alert('Receipt download started...');
  };

  const handleAddToCalendar = () => {
    // In a real app, this would create calendar events
    alert('Adding to calendar...');
  };

  const handleShare = () => {
    // In a real app, this would open share dialog
    alert('Share booking details...');
  };

  return (
    <Card className='space-y-6 p-6'>
      {/* Success Icon */}
      <div className='text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
          <CheckCircle className='h-8 w-8 text-green-600' />
        </div>
        <h2>Booking Confirmed!</h2>
        <p className='text-muted-foreground mt-2'>Your session has been successfully booked</p>
      </div>

      <Separator />

      {/* Booking Details */}
      <div className='space-y-4'>
        <div>
          <p className='text-muted-foreground mb-1 text-sm'>Booking ID</p>
          <p className='font-mono'>{booking.id}</p>
        </div>

        <div>
          <p className='text-muted-foreground mb-1 text-sm'>Instructor</p>
          <p>{instructor.name}</p>
          <p className='text-muted-foreground text-sm'>{instructor.title}</p>
        </div>

        <div>
          <p className='text-muted-foreground mb-1 text-sm'>Status</p>
          <Badge className='bg-green-600'>Confirmed</Badge>
        </div>
      </div>

      <Separator />

      {/* Session Details */}
      <div className='space-y-3'>
        <p className='text-muted-foreground text-sm'>Session Details</p>

        {booking.slots.map((slot, index) => (
          <Card key={index} className='bg-muted p-4'>
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Calendar className='text-muted-foreground h-4 w-4' />
                <p>
                  {slot.date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Clock className='text-muted-foreground h-4 w-4' />
                <p className='text-muted-foreground text-sm'>
                  {slot.startTime} - {slot.endTime} ({slot.duration}h)
                </p>
              </div>
              <div className='flex items-center gap-2'>
                {slot.mode === 'online' ? (
                  <>
                    <Video className='text-muted-foreground h-4 w-4' />
                    <p className='text-muted-foreground text-sm'>Online Session</p>
                  </>
                ) : (
                  <>
                    <MapPin className='text-muted-foreground h-4 w-4' />
                    <p className='text-muted-foreground text-sm'>
                      {slot.venue || 'Onsite Session'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Payment Summary */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>Total Sessions</span>
          <span>{booking.totalSessions}</span>
        </div>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>Total Duration</span>
          <span>{booking.totalDuration} hours</span>
        </div>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>Payment Method</span>
          <span className='capitalize'>{booking.paymentMethod?.replace('-', ' ')}</span>
        </div>
        <Separator />
        <div className='flex items-center justify-between'>
          <span>Total Paid</span>
          <span className='text-xl'>
            {booking.currency} ${booking.totalFee.toFixed(2)}
          </span>
        </div>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className='space-y-2'>
        <Button onClick={handleAddToCalendar} variant='outline' className='w-full gap-2'>
          <Calendar className='h-4 w-4' />
          Add to Calendar
        </Button>

        <Button onClick={handleDownloadReceipt} variant='outline' className='w-full gap-2'>
          <Download className='h-4 w-4' />
          Download Receipt
        </Button>

        <Button onClick={handleShare} variant='outline' className='w-full gap-2'>
          <Share2 className='h-4 w-4' />
          Share
        </Button>

        <Button onClick={onClose} className='w-full'>
          View My Bookings
        </Button>
      </div>

      {/* Notification Info */}
      <div className='text-muted-foreground flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs'>
        <Mail className='mt-0.5 h-3 w-3 text-blue-600' />
        <p className='text-blue-900'>
          A confirmation email has been sent to your registered email address with all the session
          details and joining instructions.
        </p>
      </div>
    </Card>
  );
};
