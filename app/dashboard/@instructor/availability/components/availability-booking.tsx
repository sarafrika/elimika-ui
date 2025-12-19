'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Filter, MapPin, Phone, Search, Video } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AvailabilityData } from './types';

interface AvailabilityBookingProps {
  availabilityData: AvailabilityData;
  onBookingRequest: (slotId: string, bookingData: BookingRequestData) => void;
}

interface BookingRequestData {
  studentName: string;
  studentEmail: string;
  subject: string;
  message: string;
  preferredMethod: 'online' | 'in-person' | 'phone';
}

export function AvailabilityBooking({
  availabilityData,
  onBookingRequest,
}: AvailabilityBookingProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<BookingRequestData>({
    studentName: '',
    studentEmail: '',
    subject: '',
    message: '',
    preferredMethod: 'online',
  });
  const [filterDays, setFilterDays] = useState<string[]>([]);
  const [filterTimeRange, setFilterTimeRange] = useState<
    'morning' | 'afternoon' | 'evening' | 'all'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  const availableSlots = useMemo(() => {
    const now = new Date();
    const slots = availabilityData?.slots
      ?.filter(slot => slot.is_available === true)
      ?.filter(slot => {
        // Only show future slots
        if (slot.date) {
          return slot.date > now;
        }
        // For recurring slots, show all
        return true;
      })
      .sort((a, b) => {
        // Sort by date first, then by time
        if (a.date && b.date) {
          const dateDiff = a.date.getTime() - b.date.getTime();
          if (dateDiff !== 0) return dateDiff;
        }
        return a.startTime.localeCompare(b.startTime);
      });

    // Apply filters
    let filteredSlots = slots;

    if (filterDays.length > 0) {
      filteredSlots = filteredSlots.filter(slot => filterDays.includes(slot.day.toLowerCase()));
    }

    if (filterTimeRange !== 'all') {
      filteredSlots = filteredSlots.filter(slot => {
        const hour = parseInt(slot?.startTime?.split(':')[0] || '', 10);
        switch (filterTimeRange) {
          case 'morning':
            return hour >= 6 && hour < 12;
          case 'afternoon':
            return hour >= 12 && hour < 17;
          case 'evening':
            return hour >= 17 && hour <= 21;
          default:
            return true;
        }
      });
    }

    if (searchQuery) {
      // This is a simple implementation - in a real app, you might search by subject, tags, etc.
      filteredSlots = filteredSlots.filter(
        slot =>
          slot.day.toLowerCase().includes(searchQuery.toLowerCase()) ||
          slot.startTime.includes(searchQuery)
      );
    }

    return filteredSlots;
  }, [availabilityData.slots, filterDays, filterTimeRange, searchQuery]);

  const handleBookingSubmit = () => {
    if (!selectedSlot) return;

    onBookingRequest(selectedSlot, bookingData);
    setSelectedSlot(null);
    setBookingData({
      studentName: '',
      studentEmail: '',
      subject: '',
      message: '',
      preferredMethod: 'online',
    });
  };

  const getNextWeekSlots = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return availableSlots
      ?.filter(slot => {
        if (!slot.date) return false;
        return slot.date <= nextWeek;
      })
      .slice(0, 6); // Show max 6 upcoming slots
  };

  const getTimeRangeLabel = (time: string) => {
    const hour = parseInt(time?.split(':')[0] || '', 10);
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours as string, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const nextWeekSlots = getNextWeekSlots();

  return (
    <div className='space-y-6'>
      {/* Quick Book Section - Next Week */}
      {nextWeekSlots?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Clock className='h-5 w-5' />
              Quick Book - This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
              {nextWeekSlots.map(slot => (
                <Card key={slot.id} className='border-success/30 bg-success/10 border'>
                  <CardContent className='p-4'>
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium'>
                          {slot.date ? formatDate(slot.date) : slot.day}
                        </span>
                        <Badge variant='secondary' className='bg-success/10 text-success'>
                          {getTimeRangeLabel(slot.startTime)}
                        </Badge>
                      </div>
                      <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                        <Clock className='h-4 w-4' />
                        <span>
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </span>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size='sm'
                            className='mt-2 w-full'
                            onClick={() => setSelectedSlot(slot.id)}
                          >
                            Book This Slot
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Book Appointment</DialogTitle>
                          </DialogHeader>
                          <BookingForm
                            slot={slot}
                            bookingData={bookingData}
                            setBookingData={setBookingData}
                            onSubmit={handleBookingSubmit}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Filter className='h-5 w-5' />
            Find Available Times
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='space-y-2'>
              <Label>Search</Label>
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-2.5 left-3 h-4 w-4' />
                <Input
                  placeholder='Search by day or time...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Preferred Days</Label>
              <Select
                value={filterDays.length === 0 ? 'any' : filterDays.join(',')}
                onValueChange={value =>
                  setFilterDays(value === 'any' ? [] : value.split(',').filter(Boolean))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Any day' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='any'>Any day</SelectItem>
                  <SelectItem value='monday,tuesday,wednesday,thursday,friday'>Weekdays</SelectItem>
                  <SelectItem value='saturday,sunday'>Weekends</SelectItem>
                  <SelectItem value='monday'>Monday</SelectItem>
                  <SelectItem value='tuesday'>Tuesday</SelectItem>
                  <SelectItem value='wednesday'>Wednesday</SelectItem>
                  <SelectItem value='thursday'>Thursday</SelectItem>
                  <SelectItem value='friday'>Friday</SelectItem>
                  <SelectItem value='saturday'>Saturday</SelectItem>
                  <SelectItem value='sunday'>Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Time of Day</Label>
              <Select
                value={filterTimeRange}
                onValueChange={(value: any) => setFilterTimeRange(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Any time</SelectItem>
                  <SelectItem value='morning'>Morning (6AM - 12PM)</SelectItem>
                  <SelectItem value='afternoon'>Afternoon (12PM - 5PM)</SelectItem>
                  <SelectItem value='evening'>Evening (5PM - 9PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Slots List */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span className='flex items-center gap-2'>
              <Calendar className='h-5 w-5' />
              Available Appointments
            </span>
            <Badge variant='secondary'>{availableSlots?.length} slots available</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableSlots?.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center'>
              <Calendar className='mx-auto mb-4 h-12 w-12 opacity-50' />
              <p>No available slots match your criteria.</p>
              <p className='text-sm'>Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <div className='max-h-96 space-y-3 overflow-y-auto'>
              {availableSlots?.map(slot => (
                <div
                  key={slot.id}
                  className='hover:bg-muted/60 flex items-center justify-between rounded-lg border p-4'
                >
                  <div className='flex items-center gap-4'>
                    <div className='flex flex-col'>
                      <span className='font-medium'>
                        {slot.date ? formatDate(slot.date) : `Every ${slot.day}`}
                      </span>
                      <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                        <Clock className='h-4 w-4' />
                        <span>
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </span>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Badge
                        variant='outline'
                        className='border-success/30 bg-success/10 text-success'
                      >
                        Available
                      </Badge>
                      <Badge variant='secondary'>{getTimeRangeLabel(slot.startTime)}</Badge>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant='outline' onClick={() => setSelectedSlot(slot.id)}>
                        Book
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Book Appointment</DialogTitle>
                      </DialogHeader>
                      <BookingForm
                        slot={slot}
                        bookingData={bookingData}
                        setBookingData={setBookingData}
                        onSubmit={handleBookingSubmit}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Booking Form Component
function BookingForm({
  slot,
  bookingData,
  setBookingData,
  onSubmit,
}: {
  slot: any;
  bookingData: BookingRequestData;
  setBookingData: (data: BookingRequestData) => void;
  onSubmit: () => void;
}) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours as string, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className='space-y-4'>
      {/* Slot Info */}
      <Card className='border-primary/30 bg-primary/10'>
        <CardContent className='p-4'>
          <div className='mb-2 flex items-center gap-2'>
            <Calendar className='text-primary h-4 w-4' />
            <span className='font-medium'>
              {slot.date ? formatDate(slot.date) : `Every ${slot.day}`}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Clock className='text-primary h-4 w-4' />
            <span>
              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Booking Form */}
      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='name'>Your Name *</Label>
          <Input
            id='name'
            value={bookingData.studentName}
            onChange={e => setBookingData({ ...bookingData, studentName: e.target.value })}
            placeholder='Enter your full name'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='email'>Email Address *</Label>
          <Input
            id='email'
            type='email'
            value={bookingData.studentEmail}
            onChange={e => setBookingData({ ...bookingData, studentEmail: e.target.value })}
            placeholder='your.email@example.com'
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='subject'>Subject/Topic</Label>
        <Input
          id='subject'
          value={bookingData.subject}
          onChange={e => setBookingData({ ...bookingData, subject: e.target.value })}
          placeholder='What would you like to discuss?'
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='method'>Preferred Method</Label>
        <Select
          value={bookingData.preferredMethod}
          onValueChange={(value: any) => setBookingData({ ...bookingData, preferredMethod: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='online'>
              <div className='flex items-center gap-2'>
                <Video className='h-4 w-4' />
                <span>Online (Video Call)</span>
              </div>
            </SelectItem>
            <SelectItem value='in-person'>
              <div className='flex items-center gap-2'>
                <MapPin className='h-4 w-4' />
                <span>In Person</span>
              </div>
            </SelectItem>
            <SelectItem value='phone'>
              <div className='flex items-center gap-2'>
                <Phone className='h-4 w-4' />
                <span>Phone Call</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='message'>Message (Optional)</Label>
        <Textarea
          id='message'
          value={bookingData.message}
          onChange={e => setBookingData({ ...bookingData, message: e.target.value })}
          placeholder='Any additional information or questions...'
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button
          onClick={onSubmit}
          disabled={!bookingData.studentName || !bookingData.studentEmail}
          className='w-full'
        >
          Send Booking Request
        </Button>
      </DialogFooter>
    </div>
  );
}
