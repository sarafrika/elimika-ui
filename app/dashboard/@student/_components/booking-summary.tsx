'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Calendar, Clock, DollarSign, MapPin, Video } from 'lucide-react';
import React, { useState } from 'react';
import { Booking } from '../browse-courses/instructor/[id]/page';
import { BookingConfirmation } from './booking-confirmation';
import { PaymentModal } from './payment-modal';

type Props = {
  instructor: any;
  selectedSlots: any[];
  onBack: () => void;
  onBookingComplete: (booking: Booking) => void;
};

export const BookingSummary: React.FC<Props> = ({
  instructor,
  selectedSlots,
  onBack,
  onBookingComplete,
}) => {
  const [showPayment, setShowPayment] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  // Calculate totals
  const totalSessions = selectedSlots.length;
  const totalDuration = selectedSlots.reduce((sum, slot) => sum + slot.duration, 0);

  const calculateFee = (duration: number): number => {
    if (duration >= 8) return rateCard.fullDay;
    if (duration >= 4) return rateCard.halfDay;
    return rateCard.hourly * duration;
  };

  const totalFee = selectedSlots.reduce((sum, slot) => sum + calculateFee(slot.duration), 0);

  const handleProceedToPayment = () => {
    if (selectedSlots.length === 0) return;
    setShowPayment(true);
  };

  const handlePaymentComplete = (paymentMethod: string) => {
    // Create booking
    const booking: Booking = {
      id: `booking-${Date.now()}`,
      studentId: 'student-current', // Would come from auth context
      studentName: 'Current Student', // Would come from auth context
      instructorId: instructor.id,
      instructorName: instructor.name,
      slots: selectedSlots,
      totalSessions,
      totalDuration,
      totalFee,
      currency: instructor.rateCard.currency,
      paymentMethod: paymentMethod as any,
      paymentStatus: 'completed',
      status: 'confirmed',
      createdAt: new Date(),
      confirmedAt: new Date(),
    };

    setCompletedBooking(booking);
    setShowPayment(false);
    setShowConfirmation(true);
  };

  const handleConfirmationClose = () => {
    if (completedBooking) {
      onBookingComplete(completedBooking);
    }
  };

  if (showConfirmation && completedBooking) {
    return (
      <BookingConfirmation
        booking={completedBooking}
        instructor={instructor}
        onClose={handleConfirmationClose}
      />
    );
  }

  if (showPayment) {
    return (
      <PaymentModal
        totalFee={totalFee}
        currency={rateCard.currency}
        onBack={() => setShowPayment(false)}
        onPaymentComplete={handlePaymentComplete}
      />
    );
  }

  return (
    <Card className='sticky top-6 space-y-6 p-6'>
      <div>
        <h3>Booking Summary</h3>
        <p className='text-muted-foreground mt-1 text-sm'>Review your booking details</p>
      </div>
      <Separator />

      {/* Instructor Info */}
      <div>
        <p className='text-muted-foreground mb-1 text-sm'>Instructor</p>
        <p>{instructor.full_name}</p>
        <p className='text-muted-foreground text-sm'>{instructor.professional_headline}</p>
      </div>

      <Separator />

      {/* Session Details */}
      <div className='space-y-3'>
        <p className='text-muted-foreground text-sm'>Session Details</p>

        <div className='flex items-center justify-between'>
          <span className='flex items-center gap-2 text-sm'>
            <Calendar className='h-4 w-4' />
            Total Sessions
          </span>
          <span>{totalSessions}</span>
        </div>

        <div className='flex items-center justify-between'>
          <span className='flex items-center gap-2 text-sm'>
            <Clock className='h-4 w-4' />
            Total Duration
          </span>
          <span>{totalDuration} hours</span>
        </div>

        {selectedSlots?.length > 0 && (
          <div className='flex items-center justify-between'>
            <span className='flex items-center gap-2 text-sm'>
              {selectedSlots[0]?.mode === 'online' ? (
                <Video className='h-4 w-4' />
              ) : (
                <MapPin className='h-4 w-4' />
              )}
            </span>
            <Badge variant='secondary'>{selectedSlots[0].mode}</Badge>
          </div>
        )}
      </div>

      <Separator />

      {/* Price Breakdown */}
      <div className='space-y-3'>
        <p className='text-muted-foreground text-sm'>Price Breakdown</p>

        {selectedSlots.map((slot, index) => (
          <div key={index} className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>
              {slot.date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}{' '}
              - {slot.duration}h
            </span>
            <span>
              {rateCard.currency} ${calculateFee(slot.duration)}
            </span>
          </div>
        ))}

        <Separator />

        <div className='flex items-center justify-between'>
          <span className='flex items-center gap-2'>
            <DollarSign className='h-4 w-4' />
            Total Fee
          </span>
          <span className='text-xl'>
            {rateCard.currency} ${totalFee}
          </span>
        </div>
      </div>

      {/* Warning if no slots selected */}
      {selectedSlots.length === 0 && (
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Please select at least one time slot to proceed with booking.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className='space-y-2'>
        <Button
          onClick={handleProceedToPayment}
          disabled={selectedSlots?.length === 0}
          className='w-full'
        >
          Proceed to Payment
        </Button>
        <Button onClick={onBack} variant='outline' className='w-full'>
          Back to Profile
        </Button>
      </div>

      {/* Note */}
      <div className='text-muted-foreground bg-muted rounded-lg p-3 text-xs'>
        <p>
          <strong>Note:</strong> Your booking will be confirmed once the payment is processed. You
          will receive a confirmation email with all the details.
        </p>
      </div>
    </Card>
  );
};

const rateCard = {
  hourly: 50,
  halfDay: 180,
  fullDay: 320,
  currency: 'USD',
};
