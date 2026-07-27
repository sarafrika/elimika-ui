'use client';

import { CalendarIcon, Clock, MapPin, Video, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getDayLabel } from '@/lib/day-of-week';
import type { Instructor } from '@/services/client/types.gen';
import type { BookingSlot } from '@/src/features/dashboard/courses/pages/InstructorBookingPage';

type Props = {
  instructor: Instructor;
  selectedSlots: BookingSlot[];
  onSlotsChange: (slots: BookingSlot[]) => void;
};

type AvailabilitySlot = {
  date?: Date;
  day_of_week?: string;
  endTime?: string;
  is_available?: boolean;
  startTime?: string;
  time_range?: string;
  uuid?: string;
};

export const BookingCalendar: React.FC<Props> = ({ instructor, selectedSlots, onSlotsChange }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [duration, setDuration] = useState<string>('1'); // hours
  const [mode, setMode] = useState<'online' | 'onsite'>('online');
  const [venue, setVenue] = useState<string>('');
  const [recurring, setRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [recurringEndDate, setRecurringEndDate] = useState<Date | undefined>();

  const availability: AvailabilitySlot[] = [];
  const availableSlots: AvailabilitySlot[] = [];

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    if (!selectedDate) return;
    if (!slot.startTime || !slot.endTime) return;

    const newSlot: BookingSlot = {
      id: `booking-${Date.now()}`,
      date: selectedDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: parseFloat(duration),
      mode,
      venue: mode === 'onsite' ? venue : undefined,
    };

    // Check if slot already selected
    const isSelected = selectedSlots.some(
      s =>
        s.date.toDateString() === newSlot.date.toDateString() && s.startTime === newSlot.startTime
    );

    if (isSelected) {
      // Remove slot
      onSlotsChange(
        selectedSlots.filter(
          s =>
            !(
              s.date.toDateString() === newSlot.date.toDateString() &&
              s.startTime === newSlot.startTime
            )
        )
      );
    } else {
      // Add slot
      onSlotsChange([...selectedSlots, newSlot]);
    }
  };

  const isSlotSelected = (date: Date, startTime: string) => {
    return selectedSlots.some(
      s => s.date.toDateString() === date.toDateString() && s.startTime === startTime
    );
  };

  const removeSlot = (slotToRemove: BookingSlot) => {
    onSlotsChange(
      selectedSlots.filter(
        s =>
          !(
            s.date.toDateString() === slotToRemove.date.toDateString() &&
            s.startTime === slotToRemove.startTime
          )
      )
    );
  };

  // Disable dates that don't have availability
  const notAvailable = availability.filter(slot => !slot.is_available);
  const disabledDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize

    const isPastDate = date < today;

    const isUnavailable = notAvailable.some(slot => {
      if (!slot.date) return false;
      const slotDate = new Date(slot.date);
      return slotDate.toDateString() === date.toDateString();
    });

    return isUnavailable || isPastDate;
  };

  return (
    <div className='space-y-6'>
      {/* Calendar */}
      <Card className='p-4'>
        <h3>Select Date & Time</h3>
        <div className='flex flex-col gap-4'>
          <div>
            <Calendar
              mode='single'
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={disabledDates}
              className='rounded-md border'
            />
          </div>

          {/* Available Time Slots */}
          <div>
            <div className='mb-4 flex items-center justify-between'>
              <Label className='mb-0'>Available Time Slots</Label>

              {(availableSlots?.length as number) > 0 && selectedDate && (
                <button
                  onClick={() => setSelectedDate(undefined)}
                  className='text-destructive hover:text-destructive/80 flex items-center gap-1 focus:outline-none'
                  aria-label='Clear selected date'
                >
                  <X className='h-4 w-4' />
                  Clear
                </button>
              )}
            </div>

            {selectedDate ? (
              (availableSlots?.length as number) > 0 ? (
                <div className='max-h-[150px] space-y-2 overflow-y-auto'>
                  {availableSlots.map(slot => {
                    const selected = slot.startTime
                      ? isSlotSelected(selectedDate, slot.startTime)
                      : false;

                    return (
                      <Button
                        key={slot.uuid}
                        variant={selected ? 'default' : 'outline'}
                        className='w-full justify-start gap-2'
                        onClick={() => handleSlotSelect(slot)}
                        // onClick={() => console.log(slot, "clicked slot")}
                      >
                        <Clock className='h-4 w-4' />
                        {getDayLabel(Number(slot.day_of_week ?? 0))} {' - '}
                        {slot.time_range ?? 'Unavailable'}
                        {selected && <Badge variant='secondary'>Selected</Badge>}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <div className='bg-muted rounded-lg p-6 text-center'>
                  <CalendarIcon className='text-muted-foreground mx-auto mb-2 h-8 w-8' />
                  <p className='text-muted-foreground'>No available slots for this date</p>
                </div>
              )
            ) : (
              <div className='bg-muted rounded-lg p-6 text-center'>
                <CalendarIcon className='text-muted-foreground mx-auto mb-2 h-8 w-8' />
                <p className='text-muted-foreground'>Select a date to see available slots</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Session Configuration */}
      <Card className='space-y-3 p-6'>
        <h3>Session Details</h3>

        {/* Duration */}
        <div>
          <Label>Duration</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className='mt-2'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='1'>1 Hour</SelectItem>
              <SelectItem value='2'>2 Hours</SelectItem>
              <SelectItem value='4'>Half Day (4 hours)</SelectItem>
              <SelectItem value='8'>Full Day (8 hours)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mode */}
        <div>
          <Label>Mode - User selects online or onsite classes</Label>
          <RadioGroup
            value={mode}
            onValueChange={value => {
              if (value === 'online' || value === 'onsite') {
                setMode(value);
              }
            }}
            className='mt-2'
          >
            {instructor.is_profile_complete && (
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='online' id='mode-online' />
                <Label htmlFor='mode-online' className='flex cursor-pointer items-center gap-2'>
                  <Video className='h-4 w-4' />
                  Online
                </Label>
              </div>
            )}
            {instructor.is_profile_complete && (
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='onsite' id='mode-onsite' />
                <Label htmlFor='mode-onsite' className='flex cursor-pointer items-center gap-2'>
                  <MapPin className='h-4 w-4' />
                  Onsite
                </Label>
              </div>
            )}
          </RadioGroup>
        </div>

        {/* Venue (if onsite) */}
        {mode === 'onsite' && (
          <div>
            <Label>Venue</Label>
            <input
              type='text'
              placeholder='Enter venue address...'
              value={venue}
              onChange={e => setVenue(e.target.value)}
              className='border-border mt-2 w-full rounded-md border px-3 py-2'
            />
          </div>
        )}

        {/* Recurring */}
        <div className='space-y-4'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='recurring'
              checked={recurring}
              onCheckedChange={checked => setRecurring(checked as boolean)}
            />
            <Label htmlFor='recurring' className='cursor-pointer'>
              Recurring sessions
            </Label>
          </div>

          {recurring && (
            <div className='border-border mb-6 space-y-4 border-l-2 pl-6'>
              <div>
                <Label>Frequency</Label>
                <Select
                  value={recurringFrequency}
                  onValueChange={value => {
                    if (value === 'daily' || value === 'weekly') {
                      setRecurringFrequency(value);
                    }
                  }}
                >
                  <SelectTrigger className='mt-2'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='daily'>Daily</SelectItem>
                    <SelectItem value='weekly'>Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>End Date</Label>
                <Calendar
                  mode='single'
                  selected={recurringEndDate}
                  onSelect={setRecurringEndDate}
                  // disabled={date =>
                  //     date < new Date() || (selectedDate && date <= selectedDate)
                  // }
                  className='mt-2 rounded-md border'
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Selected Slots Summary */}
      {selectedSlots.length > 0 && (
        <Card className='p-6'>
          <h3 className='mb-4'>Selected Sessions ({selectedSlots.length})</h3>
          <div className='space-y-2'>
            {selectedSlots.map((slot, index) => (
              <div
                key={`${slot.date}-${slot.startTime}-${index}`}
                className='bg-muted flex items-center justify-between rounded-lg p-3'
              >
                <div className='flex items-center gap-3'>
                  <CalendarIcon className='text-muted-foreground h-4 w-4' />
                  <div>
                    <p>
                      {slot.date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className='text-muted-foreground text-sm'>
                      {slot.startTime} - {slot.endTime} ({slot.duration}h, {slot.mode})
                    </p>
                  </div>
                </div>
                <Button variant='ghost' size='sm' onClick={() => removeSlot(slot)}>
                  <X className='h-4 w-4' />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
