'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, Clock, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ClassData } from '../../trainings/create-new/academic-period-form';
import type { AvailabilityData, CalendarEvent } from './types';

interface MonthlyAvailabilityGridProps {
  availabilityData: AvailabilityData;
  onAvailabilityUpdate: (data: AvailabilityData) => void;
  isEditing: boolean;
  classes: ClassData[];
}

const eventColorMap = {
  SCHEDULED_INSTANCE: {
    border: 'border-primary/40',
    text: 'text-primary',
    icon: 'text-primary',
    bg: 'bg-primary/10',
  },
  BLOCKED: {
    border: 'border-destructive/40',
    text: 'text-destructive',
    icon: 'text-destructive',
    bg: 'bg-destructive/10',
  },
  AVAILABILITY: {
    border: 'border-green-500/40',
    text: 'text-green-600',
    icon: 'text-green-600',
    bg: 'bg-green-500/10',
  },
};

export function MonthlyAvailabilityGrid({
  availabilityData,
  onAvailabilityUpdate,
  isEditing,
  classes,
}: MonthlyAvailabilityGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [_isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [_selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [_selectedSlot, setSelectedSlot] = useState<{
    day: string;
    time: string;
    date: Date;
  } | null>(null);

  const monthData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);

    // Get the first Monday of the calendar view
    const startDay = startDate.getDay();
    const daysToSubtract = startDay === 0 ? 6 : startDay - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);

    // Get the last Sunday of the calendar view
    const endDay = endDate.getDay();
    const daysToAdd = endDay === 0 ? 0 : 7 - endDay;
    endDate.setDate(endDate.getDate() + daysToAdd);

    const days = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return {
      year,
      month,
      firstDay,
      lastDay,
      days,
    };
  }, [currentMonth]);

  const getDayStatus = (date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

    // Get all slots for this day
    const daySlots = availabilityData.events.filter(slot => {
      if (slot.date) {
        return slot.date.toDateString() === date.toDateString();
      }
      // For recurring slots, check by day name
      return slot.day === dayName;
    });

    // Check for scheduled classes
    const dayClasses = classes.filter(classItem => {
      if (classItem.status !== 'published') return false;

      return classItem.timetable.timeSlots.some(timeSlot => {
        const isCorrectDay = timeSlot.day.toLowerCase() === dayName.toLowerCase();
        const isWithinPeriod =
          date >= new Date(classItem.academicPeriod.startDate) &&
          date <= new Date(classItem.academicPeriod.endDate);

        return isCorrectDay && isWithinPeriod;
      });
    });

    // Check for events on this day
    const dayEvents = [
      ...availabilityData.events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === date.toDateString();
      }),
    ];

    // const availableSlots = daySlots.filter(slot => slot.status === 'SCHEDULED').length;
    const blockedEvents = daySlots.filter(slot => slot.entry_type === 'BLOCKED');

    const bookedEvents = [...daySlots.filter(slot => slot.entry_type === 'SCHEDULED_INSTANCE')];

    return {
      // available: availableSlots,
      blocked: blockedEvents,
      booked: bookedEvents,
      total: daySlots.length,
      classes: dayClasses,
      events: dayEvents,
    };
  };

  const getDayClass = (date: Date, _status: ReturnType<typeof getDayStatus>) => {
    const isCurrentMonth = date.getMonth() === monthData.month;
    const isToday = date.toDateString() === new Date().toDateString();

    let baseClasses =
      'h-20 p-2 border border-border rounded cursor-pointer transition-colors relative';

    if (!isCurrentMonth) {
      baseClasses += ' bg-muted/60 text-muted-foreground';
    } else if (isToday) {
      baseClasses += ' ring-2 ring-primary bg-primary/10';
    } else {
      baseClasses += ' bg-card hover:bg-muted/60';
    }

    return baseClasses;
  };

  const handleDayClick = (date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

    // Check if there's an existing event for this day
    const eventsForDay = availabilityData.events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });

    if (eventsForDay.length > 0) {
      // If there are events, select the first one for editing
      setSelectedEvent(eventsForDay[0] as any);
      setSelectedSlot(null);
    } else {
      // Create new event for this day
      setSelectedEvent(null);
      setSelectedSlot({
        day: dayName,
        time: '09:00', // Default time
        date,
      });
    }

    setIsEventModalOpen(true);
  };

  const _getEventForSlot = (day: string, time: string, date: Date) => {
    return availabilityData.events.find(event => {
      const eventDate = new Date(event.date);
      const isSameDate = eventDate.toDateString() === date.toDateString();
      const isSameDay = event.day.toLowerCase() === day.toLowerCase();

      // Check if the time slot falls within the event's duration
      const slotTime = new Date(`2000-01-01T${time}:00`);
      const eventStart = new Date(`2000-01-01T${event.startTime}:00`);
      const eventEnd = new Date(`2000-01-01T${event.endTime}:00`);

      const isWithinTimeRange = slotTime >= eventStart && slotTime < eventEnd;

      return isSameDate && isSameDay && isWithinTimeRange;
    });
  };

  const _handleSaveEvent = (eventData: CalendarEvent) => {
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

  const _handleDeleteEvent = (eventId: string) => {
    const updatedEvents = availabilityData.events.filter(e => e.id !== eventId);
    onAvailabilityUpdate({
      ...availabilityData,
      events: updatedEvents,
    });
  };

  const _getEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    return `${(Number(hours) + 1).toString().padStart(2, '0')}:${minutes?.toString().padStart(2, '0')}`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className='space-y-4'>
      {/* Month Navigation */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='outline' size='sm' onClick={() => navigateMonth('prev')}>
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <h3 className='text-xl font-medium'>{monthName}</h3>
          <Button variant='outline' size='sm' onClick={() => navigateMonth('next')}>
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>

        {isEditing && (
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm'>
              <Plus className='mr-2 h-4 w-4' />
              Bulk Add
            </Button>
            <Button variant='outline' size='sm'>
              <Trash2 className='mr-2 h-4 w-4' />
              Clear Month
            </Button>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className='overflow-hidden rounded-lg border'>
        {/* Weekday Headers */}
        <div className='grid grid-cols-7 border-b'>
          {weekdays.map(day => (
            <div key={day} className='border-r p-3 text-center text-sm font-medium last:border-r-0'>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className='grid grid-cols-7'>
          {monthData.days.map((date, index) => {
            const status = getDayStatus(date);
            const isCurrentMonth = date.getMonth() === monthData.month;

            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild className='min-h-[150px]'>
                    <div className={getDayClass(date, status)} onClick={() => handleDayClick(date)}>
                      <div className='flex h-full items-start justify-between'>
                        <span
                          className={`text-sm font-medium ${!isCurrentMonth ? 'text-muted-foreground' : ''}`}
                        >
                          {date.getDate()}
                        </span>

                        {/* Status Indicators */}
                        <div className='flex flex-col gap-1'>
                          {status.booked.length > 0 && (
                            <div className='bg-primary h-2 w-2 rounded-full' />
                          )}

                          {status.blocked.length > 0 && (
                            <div className='bg-destructive h-2 w-2 rounded-full' />
                          )}
                        </div>
                      </div>

                      {/* Event blocks and bottom indicators */}
                      {status.events.length > 0 && (
                        <div className='absolute top-6 right-1 left-1'>
                          {status.events.slice(0, 2).map(event => {
                            const colors =
                              eventColorMap[event?.entry_type || 'SCHEDULED_INSTANCE'] ??
                              eventColorMap.SCHEDULED_INSTANCE;

                            return (
                              <div
                                key={event.id}
                                className={`mb-1 truncate rounded px-1 py-0.5 text-xs ${colors.border} ${colors.text} ${colors.bg}`}
                              >
                                <div className='flex items-center gap-1'>
                                  <Clock className={`h-2 w-2 ${colors.icon}`} />
                                  <span className='font-medium'>{event.title}</span>
                                </div>

                                <div className='text-xs'>
                                  {event.startTime} - {event.endTime}
                                </div>
                                {/* <div className='text-xs'>
                                  {event?.location}
                                </div>
                                <div className='text-xs'>
                                  {event?.attendees} attendees
                                </div> */}
                              </div>
                            );
                          })}

                          {status.events.length > 2 && (
                            <div className='text-muted-foreground text-xs font-medium'>
                              +{status.events.length - 2} more events
                            </div>
                          )}
                        </div>
                      )}

                      <div className='absolute right-1 bottom-1 left-1'>
                        <div className='flex justify-center gap-1'>
                          {status.booked.length > 0 && (
                            <Badge className='bg-primary/10 text-primary'>
                              {status.booked.length}
                            </Badge>
                          )}

                          {status.blocked.length > 0 && (
                            <Badge className='bg-destructive/10 text-destructive'>
                              {status.blocked.length}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className='space-y-1 text-sm'>
                      <div className='font-medium'>
                        {date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>

                      {status.booked.length > 0 && (
                        <div className='text-primary'>
                          📘 {status.booked.length} booked/classes/events
                        </div>
                      )}

                      {status.blocked.length > 0 && (
                        <div className='text-destructive'>
                          ⛔ {status.blocked.length} blocked slots
                        </div>
                      )}

                      {status.events.length > 0 && (
                        <div className='text-accent mt-1 text-xs'>
                          Events:{' '}
                          {status.events
                            .map(e => `${e.title} (${e.startTime}-${e.endTime})`)
                            .join(', ')}
                        </div>
                      )}

                      {status.classes.length > 0 && (
                        <div className='text-muted-foreground mt-2 text-xs'>
                          Classes: {status.classes.map(c => c.classTitle).join(', ')}
                        </div>
                      )}

                      {status.total === 0 && status.events.length === 0 && (
                        <div className='text-muted-foreground'>Click to add event</div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <Card className='p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-6 text-sm'>
            <div className='flex items-center gap-2'>
              <div className='bg-primary h-3 w-3 rounded-full' />
              <span>Classes & Bookings</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='bg-destructive h-3 w-3 rounded-full' />
              <span>Blocked/Unavailable</span>
            </div>
          </div>

          <div className='text-muted-foreground text-sm'>Click days to add or edit events</div>
        </div>
      </Card>

      {/* Event Modal */}
      {/* <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        event={selectedEvent}
        selectedSlot={selectedSlot}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      /> */}
    </div>
  );
}
