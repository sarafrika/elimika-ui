'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../../../../components/ui/badge';
import type { ClassData } from '../../trainings/create-new/academic-period-form';
import { EventModal } from './event-modal';
import type { AvailabilityData, CalendarEvent } from './types';
import { mapEventTypeToStatus } from './weekly-availability-grid';

interface DailyAvailabilityGridProps {
  availabilityData: AvailabilityData;
  onAvailabilityUpdate: (data: AvailabilityData) => void;
  isEditing: boolean;
  classes: ClassData[];
}

export function DailyAvailabilityGrid({
  availabilityData,
  onAvailabilityUpdate,
  classes,
}: DailyAvailabilityGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ time: string; date: Date } | null>(null);

  const timeSlots = generateTimeSlots();

  function generateTimeSlots() {
    const slots = [];
    for (let hour = 5; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getSlotStatus = (time: string, date: Date) => {
    const event = getEventForSlot(time, date);
    if (event) return event.status;

    const slot = availabilityData.events.find(s => {
      if (s.startTime !== time) return false;
      if (!doesSlotApplyToDate(s, date)) return false;
      return true;
    });

    if (slot) return mapEventTypeToStatus(slot.entry_type || 'SCHEDULED_INSTANCE');

    const hasClass = classes.some(classItem => {
      if (classItem.status !== 'published') return false;
      return classItem.timetable.timeSlots.some(timeSlot => {
        const classDate = new Date(date);
        const isCorrectTime = timeSlot.startTime === time;
        const isWithinPeriod =
          classDate >= new Date(classItem.academicPeriod.startDate) &&
          classDate <= new Date(classItem.academicPeriod.endDate);
        return isCorrectTime && isWithinPeriod;
      });
    });

    if (hasClass) return 'booked';
    return null;
  };

  const getAvailabilityForSlot = (day: string, time: string) => {
    return availabilityData?.events?.find((slot: any) => {
      if (slot?.day?.toLowerCase() !== day.toLowerCase()) return false;
      const slotTime = new Date(`2000-01-01T${time}:00`);
      const start = new Date(`2000-01-01T${slot.startTime}:00`);
      const end = new Date(`2000-01-01T${slot.endTime}:00`);
      return slotTime >= start && slotTime < end && slot.entry_type === 'AVAILABILITY';
    });
  };

  const isAvailabilityStartSlot = (day: string, time: string) => {
    return availabilityData.events.some(
      (slot: any) =>
        slot?.day?.toLowerCase() === day.toLowerCase() &&
        slot?.startTime === time &&
        slot.entry_type === 'AVAILABILITY'
    );
  };

  function doesSlotApplyToDate(slot: any, date: Date) {
    if (slot.recurring) {
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
      return weekday.toLowerCase() === slot.day.toLowerCase();
    }
    if (slot.date) {
      const slotDate = new Date(slot.date);
      return slotDate.toDateString() === date.toDateString();
    }
    return false;
  }

  const getBlockedSlot = (time: string, date: Date) => {
    return availabilityData?.events?.find(slot => {
      if (slot.entry_type !== 'BLOCKED') return false;
      if (!doesSlotApplyToDate(slot, date)) return false;
      const slotTime = new Date(`2000-01-01T${time}:00`);
      const start = new Date(`2000-01-01T${slot.startTime}:00`);
      const end = new Date(`2000-01-01T${slot.endTime}:00`);
      return slotTime >= start && slotTime < end;
    });
  };

  const isBlockedStartSlot = (day: string, time: string, date: Date) => {
    return availabilityData.events.some(slot => {
      if (slot.entry_type !== 'BLOCKED') return false;
      if (!doesSlotApplyToDate(slot, date)) return false;
      return slot.day.toLowerCase() === day.toLowerCase() && slot.startTime === time;
    });
  };

  const getEventForSlot = (time: string, date: Date) => {
    return availabilityData?.events?.find(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      const isSameDate = eventDate.toDateString() === date.toDateString();
      const slotTime = new Date(`2000-01-01T${time}:00`);
      const eventStart = new Date(`2000-01-01T${event.startTime}:00`);
      const eventEnd = new Date(`2000-01-01T${event.endTime}:00`);
      const isWithinTimeRange = slotTime >= eventStart && slotTime < eventEnd;
      return isSameDate && isWithinTimeRange;
    });
  };

  const isEventStartSlot = (time: string, date: Date) => {
    const event = getEventForSlot(time, date);
    if (!event) return false;
    return event.startTime === time;
  };

  const getEventSpanHeight = (event: CalendarEvent) => {
    const start = new Date(`2000-01-01T${event.startTime}:00`);
    const end = new Date(`2000-01-01T${event.endTime}:00`);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return durationMinutes / 60;
  };

  const shouldSkipSlot = (time: string, date: Date) => {
    const event = getEventForSlot(time, date);
    if (!event) return false;
    return event.startTime !== time;
  };

  const handleSlotClick = (time: string) => {
    const existingEvent = getEventForSlot(time, currentDate);
    if (existingEvent) {
      setSelectedEvent({
        ...existingEvent,
        date: new Date(existingEvent.date),
      });
      setSelectedSlot(null);
    } else {
      setSelectedEvent(null);
      setSelectedSlot({
        time,
        date: new Date(currentDate),
      });
    }
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (eventData: CalendarEvent) => {
    const updated = [...availabilityData.events];
    const idx = updated.findIndex(e => e.id === eventData.id);
    if (idx >= 0) updated[idx] = eventData;
    else updated.push(eventData);
    onAvailabilityUpdate({ ...availabilityData, events: updated });
  };

  const handleDeleteEvent = (id: string) => {
    onAvailabilityUpdate({
      ...availabilityData,
      events: availabilityData.events.filter(e => e.id !== id),
    });
  };

  const isToday = currentDate.toDateString() === new Date().toDateString();

  return (
    <div className='space-y-6 items-start max-w-5xl mx-auto'>
      {/* Header Card */}
      <Card className='p-0 min-w-4xl'>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Button
                variant='outline'
                size='icon'
                onClick={() => navigateDay('prev')}
                className='h-9 w-9'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>

              <div className='text-center min-w-[200px]'>
                <h3 className='text-lg flex-row  font-semibold flex items-center justify-center gap-2'>
                  <Calendar className='h-5 w-5 text-primary' />
                  {currentDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                  })}

                  {isToday && (
                    <Badge variant='default'>
                      Today
                    </Badge>
                  )}
                </h3>
                <p className='text-sm text-muted-foreground mt-1'>
                  {currentDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <Button
                variant='outline'
                size='icon'
                onClick={() => navigateDay('next')}
                className='h-9 w-9'
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>

            <Button onClick={() => setCurrentDate(new Date())} variant='outline' size='sm'>
              Jump to Today
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className='overflow-hidden'>
        <div className='border-b bg-muted/30'>
          <div className='grid grid-cols-2'>
            <div className='border-r p-4 flex items-center justify-center bg-muted/50'>
              <Clock className='text-muted-foreground h-5 w-5 mr-2' />
              <span className='text-sm font-medium text-muted-foreground'>Time</span>
            </div>
            <div className='p-4 text-center'>
              <div className='text-sm font-semibold'>
                {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
              </div>
              <div className='text-xs text-muted-foreground mt-1'>
                {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        <div className='max-h-[600px] overflow-y-auto'>
          {timeSlots.map(time => {
            const status = getSlotStatus(time, currentDate);
            const event = getEventForSlot(time, currentDate);
            const isEventStart = isEventStartSlot(time, currentDate);
            const weekday = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

            if (shouldSkipSlot(time, currentDate)) return null;

            return (
              <div key={time} className='relative grid grid-cols-2 border-b last:border-b-0 hover:bg-muted/20 transition-colors'>
                <div className='text-muted-foreground flex items-center justify-center border-r p-4 text-sm font-medium bg-muted/30'>
                  {time}
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className='relative min-h-[48px] w-full cursor-pointer p-2'
                        onClick={() => handleSlotClick(time)}
                      >
                        {/* Availability Block */}
                        {isAvailabilityStartSlot(weekday, time) &&
                          (() => {
                            const slot = getAvailabilityForSlot(weekday, time);
                            if (!slot) return null;

                            return (
                              <div
                                className='absolute inset-x-2 z-10 rounded-lg transition-all hover:shadow-md'
                                style={{
                                  height: getEventSpanHeight(slot) * 52,
                                  background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%)',
                                  border: '2px solid rgba(34,197,94,0.3)',
                                }}
                              >
                                <div className='text-emerald-700 dark:text-emerald-400 flex h-full flex-col items-center justify-center text-sm font-medium px-3'>
                                  <span>Available</span>
                                  <span className='text-xs text-muted-foreground mt-1'>
                                    {slot.startTime} - {slot.endTime}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                        {/* Blocked Block */}
                        {isBlockedStartSlot(weekday, time, currentDate) &&
                          (() => {
                            const slot = getBlockedSlot(time, currentDate);
                            if (!slot) return null;

                            return (
                              <div
                                className='absolute inset-x-2 top-0 z-10 rounded-lg transition-all hover:shadow-md'
                                style={{
                                  height: getEventSpanHeight(slot) * 52,
                                  background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)',
                                  border: '2px solid rgba(239,68,68,0.3)',
                                }}
                              >
                                <div className='text-red-700 dark:text-red-400 flex h-full flex-col items-center justify-center text-sm font-medium px-3'>
                                  <span className='italic' >Blocked</span>
                                  <span className='text-xs text-muted-foreground font-bold mt-1'>
                                    {slot.startTime} - {slot.endTime}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                        {/* Event Block */}
                        {event &&
                          isEventStart &&
                          event.entry_type !== 'BLOCKED' &&
                          event.entry_type !== 'AVAILABILITY' && (
                            <div
                              className='absolute inset-x-2 top-2 z-20 rounded-lg transition-all hover:shadow-md'
                              style={{
                                height: getEventSpanHeight(event) * 52,
                                background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.05) 100%)',
                                border: '2px solid rgba(59,130,246,0.3)',
                              }}
                            >
                              <div className='flex h-full flex-col items-center justify-center text-sm font-medium px-3'>
                                <span className='text-blue-700 italic dark:text-blue-400 line-clamp-2 text-center'>
                                  {event.title}
                                </span>
                                <span className='text-[16px] font-bold text-muted-foreground mt-1'>
                                  {event.startTime} - {event.endTime}
                                </span>
                              </div>
                            </div>
                          )}

                        {/* Empty state */}
                        {!event && !isAvailabilityStartSlot(weekday, time) && !isBlockedStartSlot(weekday, time, currentDate) && (
                          <div className='flex h-full items-center justify-center text-muted-foreground/40 hover:text-muted-foreground transition-colors'>
                            <span className='text-xs'>Click to add</span>
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side='right' className='max-w-xs'>
                      <div className='text-sm space-y-1'>
                        <div className='font-medium'>{time}</div>
                        {event && (
                          <>
                            <div className='text-xs'>
                              <strong>Event:</strong> {event.title}
                            </div>
                            <div className='text-xs'>
                              <strong>Duration:</strong> {event.startTime} - {event.endTime}
                            </div>
                          </>
                        )}
                        <div className='text-xs'>
                          <strong>Status:</strong> {status || 'Available to book'}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          })}
        </div>
      </Card>

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        event={selectedEvent}
        selectedSlot={selectedSlot as any}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}