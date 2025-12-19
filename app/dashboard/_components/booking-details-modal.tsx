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
import { Calendar, Clock } from 'lucide-react';
import React from 'react';
import { getStatusColor } from './manage-bookings';

interface BookingDetailsModalProps {
  booking: any | null;
  open: boolean;
  onClose: () => void;
  instructors: any[];
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  instructors,
  open,
  onClose,
}) => {
  if (!booking) return null;

  const getInstructor = (instructorId: string) => {
    return instructors.find(i => i.uuid === instructorId);
  };

  const instructor = getInstructor(booking?.instructor_uuid);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader className='flex flex-col gap-2'>
          <div className='flex items-center'>
            <div>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>Booking ID: {booking?.uuid}</DialogDescription>
            </div>
          </div>
          <span
            className={`w-fit rounded px-2 py-1 text-xs text-white capitalize ${getStatusColor(
              booking?.status
            )}`}
          >
            {booking?.status?.replace('_', ' ') ?? 'unknown'}
          </span>
        </DialogHeader>

        <div className='mt-4 space-y-4'>
          {/* Instructor Info */}
          {instructor && (
            <Card className='p-4'>
              <div className='flex items-center gap-4'>
                <Avatar className='h-12 w-12'>
                  <AvatarImage
                    // src={instructor?.profileImage}
                    alt={instructor?.full_name}
                  />
                  <AvatarFallback>{instructor?.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className='font-medium'>{instructor?.full_name}</p>
                  <p className='text-muted-foreground text-sm'>
                    {instructor?.professional_headline}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Session Info */}
          <div>
            <Label className='mb-2 block'>Session</Label>
            <Card className='bg-muted p-4'>
              <div className='space-y-2'>
                {/* Date */}
                <div className='flex items-center gap-2'>
                  <Calendar className='text-muted-foreground h-4 w-4' />
                  <p>
                    {new Date(booking.start_time).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {/* Time */}
                <div className='flex items-center gap-2'>
                  <Clock className='text-muted-foreground h-4 w-4' />
                  <p className='text-muted-foreground text-sm'>
                    {new Date(booking.start_time).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' - '}
                    {new Date(booking.end_time).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className='flex items-center gap-2'>
                  <span>Note: {booking?.purpose}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Payment Info */}
          <Card className='p-4'>
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Payment Method</span>
                <span className='capitalize'>{booking.payment_engine?.replace('-', ' ')}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Payment Status</span>
                <Badge
                  variant={booking.paymentStatus === 'completed' ? 'default' : 'secondary'}
                  className='capitalize'
                >
                  {booking.payment_session_id}
                </Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='font-medium'>Total Amount</span>
                <span className='text-xl font-semibold'>
                  {booking.currency} {booking.price_amount}
                </span>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter className='mt-4'>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
