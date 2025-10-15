import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Calendar,
    CheckCircle,
    Clock,
    Download,
    Mail,
    MapPin,
    Share2,
    Video,
} from 'lucide-react';
import React from 'react';
import { Booking, Instructor } from '../browse-courses/instructor/[id]/page';

type Props = {
    booking: Booking;
    instructor: Instructor;
    onClose: () => void;
};

export const BookingConfirmation: React.FC<Props> = ({
    booking,
    instructor,
    onClose,
}) => {
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
        <Card className="p-6 space-y-6">
            {/* Success Icon */}
            <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2>Booking Confirmed!</h2>
                <p className="text-muted-foreground mt-2">
                    Your session has been successfully booked
                </p>
            </div>

            <Separator />

            {/* Booking Details */}
            <div className="space-y-4">
                <div>
                    <p className="text-sm text-muted-foreground mb-1">Booking ID</p>
                    <p className="font-mono">{booking.id}</p>
                </div>

                <div>
                    <p className="text-sm text-muted-foreground mb-1">Instructor</p>
                    <p>{instructor.name}</p>
                    <p className="text-sm text-muted-foreground">{instructor.title}</p>
                </div>

                <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge className="bg-green-600">Confirmed</Badge>
                </div>
            </div>

            <Separator />

            {/* Session Details */}
            <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Session Details</p>

                {booking.slots.map((slot, index) => (
                    <Card key={index} className="p-4 bg-muted">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <p>
                                    {slot.date.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    {slot.startTime} - {slot.endTime} ({slot.duration}h)
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {slot.mode === 'online' ? (
                                    <>
                                        <Video className="w-4 h-4 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">Online Session</p>
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">
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
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Sessions</span>
                    <span>{booking.totalSessions}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Duration</span>
                    <span>{booking.totalDuration} hours</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="capitalize">
                        {booking.paymentMethod?.replace('-', ' ')}
                    </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <span>Total Paid</span>
                    <span className="text-xl">
                        {booking.currency} ${booking.totalFee.toFixed(2)}
                    </span>
                </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-2">
                <Button onClick={handleAddToCalendar} variant="outline" className="w-full gap-2">
                    <Calendar className="w-4 h-4" />
                    Add to Calendar
                </Button>

                <Button onClick={handleDownloadReceipt} variant="outline" className="w-full gap-2">
                    <Download className="w-4 h-4" />
                    Download Receipt
                </Button>

                <Button onClick={handleShare} variant="outline" className="w-full gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                </Button>

                <Button onClick={onClose} className="w-full">
                    View My Bookings
                </Button>
            </div>

            {/* Notification Info */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <Mail className="w-3 h-3 mt-0.5 text-blue-600" />
                <p className="text-blue-900">
                    A confirmation email has been sent to your registered email address with all
                    the session details and joining instructions.
                </p>
            </div>
        </Card>
    );
};
