'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, Clock, Edit2, Plus } from 'lucide-react';
import { useState } from 'react';
import type { ClassData } from '../../trainings/create-new/academic-period-form';
import { EventModal, EventType, StudentBookingData } from './event-modal';
import type { AvailabilityData, CalendarEvent } from './types';

interface WeeklyAvailabilityGridProps {
  availabilityData: AvailabilityData;
  onAvailabilityUpdate: (data: AvailabilityData) => void;
  isEditing: boolean;
  classes: ClassData[];
  studentBookingData?: StudentBookingData;
}

export const mapEventTypeToStatus = (entry_type: EventType) => {
  switch (entry_type) {
    case 'AVAILABILITY':
      return 'available';
    case 'BLOCKED':
      return 'unavailable';
    case 'SCHEDULED_INSTANCE':
      return 'booked';
    default:
      return null;
  }
};

const SLOT_COLOR_MAP = {
  available:
    'bg-success/10 dark:bg-success/20 border-success/30 dark:border-success/40 hover:bg-success/15 dark:hover:bg-success/25',
  unavailable:
    'bg-destructive/10 dark:bg-destructive/20 border-destructive/30 dark:border-destructive/40 hover:bg-destructive/15 dark:hover:bg-destructive/25',
  reserved:
    'bg-warning/10 dark:bg-warning/20 border-warning/30 dark:border-warning/40 hover:bg-warning/15 dark:hover:bg-warning/25',
  booked:
    'bg-info/10 dark:bg-info/20 border-info/30 dark:border-info/40 hover:bg-info/15 dark:hover:bg-info/25',
  event:
    'bg-primary/20 dark:bg-primary/30 border-primary/50 dark:border-primary/60 hover:bg-primary/30 dark:hover:bg-primary/40 shadow-sm',
  default: 'bg-muted/40 dark:bg-muted/50 hover:bg-muted/60 dark:hover:bg-muted/70',
};

export function WeeklyAvailabilityGrid({
  availabilityData,
  onAvailabilityUpdate,
  isEditing,
  classes,
  studentBookingData,
}: WeeklyAvailabilityGridProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: string; time: string } | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string;
    time: string;
    date: Date;
  } | null>(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = generateTimeSlots();

  function generateTimeSlots() {
    const slots = [];
    for (let hour = 5; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }

  const getWeekDates = (baseDate: Date) => {
    const dates = [];
    const startOfWeek = new Date(baseDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(currentWeek);

  const getSlotStatus = (day: string, time: string, date: Date) => {
    const event = getEventForSlot(day, time, date);
    if (event) return event.status;

    const slot = availabilityData.events.find(s => {
      if (s.day !== day || s.startTime !== time) return false;
      if (!doesSlotApplyToDate(s, date)) return false;
      return true;
    });

    if (slot) return mapEventTypeToStatus(slot.entry_type || 'SCHEDULED_INSTANCE');

    const hasClass = classes.some(classItem => {
      if (classItem.status !== 'published') return false;
      return classItem.timetable.timeSlots.some(timeSlot => {
        const classDate = new Date(date);
        const isCorrectDay = timeSlot.day.toLowerCase() === day.toLowerCase();
        const isCorrectTime = timeSlot.startTime === time;
        const isWithinPeriod =
          classDate >= new Date(classItem.academicPeriod.startDate) &&
          classDate <= new Date(classItem.academicPeriod.endDate);
        return isCorrectDay && isCorrectTime && isWithinPeriod;
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

  const getBlockedSlot = (day: string, time: string, date: Date) => {
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

  const getEventForSlot = (day: string, time: string, date: Date) => {
    return availabilityData?.events?.find(event => {
      if (event.entry_type !== 'SCHEDULED_INSTANCE') return false;
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      const isSameDate = eventDate.toDateString() === date.toDateString();
      const isSameDay = event.day.toLowerCase() === day.toLowerCase();
      const slotTime = new Date(`2000-01-01T${time}:00`);
      const eventStart = new Date(`2000-01-01T${event.startTime}:00`);
      const eventEnd = new Date(`2000-01-01T${event.endTime}:00`);
      const isWithinTimeRange = slotTime >= eventStart && slotTime < eventEnd;
      return isSameDate && isSameDay && isWithinTimeRange;
    });
  };

  const isEventStartSlot = (day: string, time: string, date: Date) => {
    const event = getEventForSlot(day, time, date);
    if (!event) return false;
    return event.startTime === time;
  };

  const getEventSpanHeight = (event: CalendarEvent) => {
    const startTime = new Date(`2000-01-01T${event.startTime}:00`);
    const endTime = new Date(`2000-01-01T${event.endTime}:00`);
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const slots = Math.ceil(durationMinutes / 60);
    return slots + 1;
  };

  const shouldSkipSlot = (day: string, time: string, date: Date) => {
    const event = getEventForSlot(day, time, date);
    if (!event) return false;
    return event.startTime !== time;
  };

  const getSlotClass = (status: string | null, isEventSlot = false) => {
    const baseClasses =
      'w-full h-10 border rounded-md text-xs transition-all duration-200 cursor-pointer hover:shadow-sm';

    if (isEventSlot) {
      return `${baseClasses} ${SLOT_COLOR_MAP.event}`;
    }

    switch (status) {
      case 'available':
        return `${baseClasses} ${SLOT_COLOR_MAP.available}`;
      case 'unavailable':
        return `${baseClasses} ${SLOT_COLOR_MAP.unavailable}`;
      case 'reserved':
        return `${baseClasses} ${SLOT_COLOR_MAP.reserved}`;
      case 'booked':
        return `${baseClasses} ${SLOT_COLOR_MAP.booked}`;
      default:
        return `${baseClasses} ${SLOT_COLOR_MAP.default}`;
    }
  };

  const handleSlotClick = (day: string, time: string, date: Date) => {
    const event =
      getEventForSlot(day, time, date) ||
      getAvailabilityForSlot(day, time) ||
      getBlockedSlot(day, time, date);

    if (event) {
      const hydrated: CalendarEvent = {
        ...event,
        day,
        date: event.date ? new Date(event.date) : date,
        startTime: event.startTime,
        endTime: event.endTime,
        status: event.entry_type as any,
      };
      setSelectedEvent(hydrated);
      setSelectedSlot(null);
    } else {
      const slotData = { day, time, date };
      setSelectedEvent(null);
      setSelectedSlot(slotData);
    }
    setIsEventModalOpen(true);
  };

  const handleMouseDown = (day: string, time: string) => {
    if (!isEditing) return;
    setIsDragging(true);
    setDragStart({ day, time });
  };

  const handleMouseEnter = (day: string, time: string) => {
    if (!isDragging || !dragStart) return;
    const slotId = `${day}-${time}`;
    if (!selectedSlots.includes(slotId)) {
      setSelectedSlots(prev => [...prev, slotId]);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragStart(null);
    setSelectedSlots([]);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const handleSaveEvent = (eventData: CalendarEvent) => {
    const updatedEvents = [...availabilityData.events];
    const existingIndex = updatedEvents.findIndex(e => e.id === eventData.id);

    if (existingIndex >= 0) {
      updatedEvents[existingIndex] = eventData;
    } else {
      updatedEvents.push(eventData);
    }

    onAvailabilityUpdate({
      ...availabilityData,
      events: updatedEvents,
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    const updatedEvents = availabilityData.events.filter(e => e.id !== eventId);
    onAvailabilityUpdate({
      ...availabilityData,
      events: updatedEvents,
    });
  };

  return (
    <div className='mx-auto max-w-5xl space-y-6' onMouseUp={handleMouseUp}>
      {/* Header Card */}
      <Card className='border-0 p-0 shadow-sm'>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Button
                variant='outline'
                size='icon'
                onClick={() => navigateWeek('prev')}
                className='h-9 w-9'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>

              <div className='text-center'>
                <h3 className='text-foreground text-lg font-semibold'>
                  {weekDates[0]?.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
                <p className='text-muted-foreground text-sm'>
                  {weekDates[0]?.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  –{' '}
                  {weekDates[6]?.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <Button
                variant='outline'
                size='icon'
                onClick={() => navigateWeek('next')}
                className='h-9 w-9'
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>

            <Button onClick={() => setCurrentWeek(new Date())} variant='outline' size='sm'>
              Today
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className='overflow-hidden border-0 shadow-sm'>
        {/* Weekday Headers */}
        <div className='border-border bg-muted/30 border-b'>
          <div className='grid grid-cols-8'>
            <div className='border-border bg-muted/50 flex items-center justify-center border-r p-4'>
              <Clock className='text-muted-foreground h-5 w-5' />
            </div>
            {days.map((day, index) => {
              const date = weekDates[index];
              const isToday = date?.toDateString() === new Date().toDateString();

              return (
                <div
                  key={day}
                  className={`border-border border-r p-4 text-center transition-colors last:border-r-0 ${
                    isToday ? 'bg-primary/5' : ''
                  }`}
                >
                  <div
                    className={`text-sm font-semibold ${
                      isToday ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </div>
                  <div
                    className={`mt-1 text-xs ${
                      isToday ? 'text-primary font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {date?.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  {isToday && (
                    <Badge className='mt-1 h-5 text-xs' variant='default'>
                      Today
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Slots Grid */}
        <div className='max-h-[600px] overflow-y-auto'>
          {timeSlots.map(time => (
            <div
              key={time}
              className='border-border hover:bg-muted/20 grid grid-cols-8 border-b transition-colors last:border-b-0'
            >
              <div className='text-muted-foreground border-border bg-muted/30 flex items-center justify-center border-r p-3 text-xs font-medium'>
                {time}
              </div>
              {days.map((day, dayIndex) => {
                const date = weekDates[dayIndex];
                const status = getSlotStatus(day, time, date as any);
                const eventInSlot = getEventForSlot(day, time, date as any);
                const isEventStart = isEventStartSlot(day, time, date as any);
                const skipSlot = shouldSkipSlot(day, time, date as any);
                const availabilitySlot = getAvailabilityForSlot(day, time);
                const isAvailabilityStart = isAvailabilityStartSlot(day, time);
                const blockedSlot = getBlockedSlot(day, time, date as any);
                const isBlockedStart = isBlockedStartSlot(day, time, date as any);

                return (
                  <TooltipProvider key={`${day}-${time}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className='border-border relative border-r p-1.5 last:border-r-0'>
                          {skipSlot ? (
                            <div className='h-10 w-full' />
                          ) : (
                            <button
                              className={getSlotClass(status, eventInSlot && isEventStart)}
                              onClick={() => handleSlotClick(day, time, date as any)}
                              onMouseDown={() => handleMouseDown(day, time)}
                              onMouseEnter={() => handleMouseEnter(day, time)}
                              style={
                                availabilitySlot && isAvailabilityStart
                                  ? {
                                      height: `${
                                        getEventSpanHeight(availabilitySlot) * 48 +
                                        (getEventSpanHeight(availabilitySlot) - 1) * 6
                                      }px`,
                                      zIndex: 1,
                                      position: 'absolute',
                                      top: '0px',
                                      left: '0px',
                                      right: '6px',
                                    }
                                  : eventInSlot && isEventStart
                                    ? {
                                        height: `${
                                          getEventSpanHeight(eventInSlot) * 48 +
                                          (getEventSpanHeight(eventInSlot) - 1) * 6
                                        }px`,
                                        zIndex: 10,
                                        position: 'absolute',
                                        top: '0px',
                                        left: '0px',
                                        right: '6px',
                                      }
                                    : blockedSlot && isBlockedStart
                                      ? {
                                          height: `${
                                            getEventSpanHeight(blockedSlot) * 48 +
                                            (getEventSpanHeight(blockedSlot) - 1) * 6
                                          }px`,
                                          zIndex: 1,
                                          position: 'absolute',
                                          top: '0px',
                                          left: '0px',
                                          right: '6px',
                                        }
                                      : {}
                              }
                            >
                              {eventInSlot && isEventStart && (
                                <div className='flex h-full flex-col items-center justify-center p-2'>
                                  <Edit2 className='text-primary mb-1 h-3 w-3' />
                                  <span className='text-foreground line-clamp-2 px-1 text-center text-xs font-medium italic'>
                                    {eventInSlot.title}
                                  </span>
                                  <span className='text-muted-foreground mt-1 text-xs font-bold'>
                                    {eventInSlot.startTime} - {eventInSlot.endTime}
                                  </span>
                                </div>
                              )}

                              {blockedSlot && isBlockedStart && (
                                <div className='text-destructive flex h-full flex-col items-center justify-center text-xs font-medium italic'>
                                  <span>Blocked</span>
                                  <span className='mt-1 text-xs font-bold'>
                                    {blockedSlot.startTime} - {blockedSlot.endTime}
                                  </span>
                                </div>
                              )}

                              {!status && !eventInSlot && !blockedSlot && (
                                <div className='flex h-full items-center justify-center opacity-0 transition-opacity hover:opacity-100'>
                                  <Plus className='text-muted-foreground h-3 w-3' />
                                </div>
                              )}
                            </button>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side='top' className='max-w-xs'>
                        <div className='text-foreground space-y-1 text-sm'>
                          <div className='font-medium'>
                            {day}, {time}
                          </div>
                          {eventInSlot && (
                            <div className='text-muted-foreground text-xs'>
                              <strong className='text-foreground'>Event:</strong>{' '}
                              {eventInSlot.title}
                              <br />
                              <strong className='text-foreground'>Duration:</strong>{' '}
                              {eventInSlot.startTime} - {eventInSlot.endTime}
                            </div>
                          )}
                          <div className='text-muted-foreground text-xs'>
                            <strong className='text-foreground'>Status:</strong>{' '}
                            {status || 'Available to book'}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        event={selectedEvent}
        selectedSlot={selectedSlot}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        studentBookingData={studentBookingData}
      />
    </div>
  );
}
