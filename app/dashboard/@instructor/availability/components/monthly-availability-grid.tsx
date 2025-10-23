'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, Clock, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ClassData } from '../../trainings/create-new/academic-period-form';
import { AvailabilityData, CalendarEvent } from './types';

interface MonthlyAvailabilityGridProps {
  availabilityData: AvailabilityData;
  onAvailabilityUpdate: (data: AvailabilityData) => void;
  isEditing: boolean;
  classes: ClassData[];
}

export function MonthlyAvailabilityGrid({
  availabilityData,
  onAvailabilityUpdate,
  isEditing,
  classes,
}: MonthlyAvailabilityGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
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
    const daySlots = availabilityData.slots.filter(slot => {
      if (slot.date) {
        return slot.date.toDateString() === date.toDateString();
      }
      // For recurring slots, check by day name
      return slot.day === dayName && slot.recurring;
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
    const dayEvents = availabilityData.events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });

    const availableSlots = daySlots.filter(slot => slot.status === 'available').length;
    const unavailableSlots = daySlots.filter(slot => slot.status === 'unavailable').length;
    const bookedSlots =
      daySlots.filter(slot => slot.status === 'booked').length +
      dayClasses.length +
      dayEvents.length;

    return {
      available: availableSlots,
      unavailable: unavailableSlots,
      booked: bookedSlots,
      total: daySlots.length,
      classes: dayClasses,
      events: dayEvents,
    };
  };

  const getDayClass = (date: Date, status: ReturnType<typeof getDayStatus>) => {
    const isCurrentMonth = date.getMonth() === monthData.month;
    const isToday = date.toDateString() === new Date().toDateString();

    let baseClasses =
      'h-20 p-2 border border-gray-200 rounded cursor-pointer transition-colors relative';

    if (!isCurrentMonth) {
      baseClasses += ' bg-gray-50 text-gray-400';
    } else if (isToday) {
      baseClasses += ' ring-2 ring-blue-500 bg-blue-50';
    } else {
      baseClasses += ' bg-white hover:bg-gray-50';
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

  const getEventForSlot = (day: string, time: string, date: Date) => {
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

  const getEndTime = (startTime: string) => {
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
      <div className='overflow-hidden rounded-lg border bg-white'>
        {/* Weekday Headers */}
        <div className='grid grid-cols-7 border-b bg-gray-50'>
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
                          className={`text-sm font-medium ${!isCurrentMonth ? 'text-gray-400' : ''}`}
                        >
                          {date.getDate()}
                        </span>

                        {/* Status Indicators */}
                        <div className='flex flex-col gap-1'>
                          {status.available > 0 && (
                            <div className='h-2 w-2 rounded-full bg-green-500' />
                          )}
                          {status.booked > 0 && (
                            <div className='h-2 w-2 rounded-full bg-blue-500' />
                          )}
                          {status.unavailable > 0 && (
                            <div className='h-2 w-2 rounded-full bg-red-500' />
                          )}
                        </div>
                      </div>

                      {/* Event blocks and bottom indicators */}
                      {status.events.length > 0 && (
                        <div className='absolute top-6 right-1 left-1'>
                          {status.events.slice(0, 2).map((event, idx) => (
                            <div
                              key={event.id}
                              className='mb-1 truncate rounded border border-blue-200 bg-blue-100 px-1 py-0.5 text-xs text-blue-800'
                            >
                              <div className='flex items-center gap-1'>
                                <Clock className='h-2 w-2' />
                                <span className='font-medium'>{event.title}</span>
                              </div>
                              <div className='text-xs text-blue-600'>
                                {event.startTime} - {event.endTime}
                              </div>
                            </div>
                          ))}
                          {status.events.length > 2 && (
                            <div className='text-xs font-medium text-gray-500'>
                              +{status.events.length - 2} more events
                            </div>
                          )}
                        </div>
                      )}

                      <div className='absolute right-1 bottom-1 left-1'>
                        <div className='flex justify-center gap-1'>
                          {status.available > 0 && (
                            <Badge
                              variant='secondary'
                              className='bg-green-100 px-1 py-0 text-xs text-green-700'
                            >
                              {status.available}
                            </Badge>
                          )}
                          {status.booked > 0 && (
                            <Badge
                              variant='secondary'
                              className='bg-blue-100 px-1 py-0 text-xs text-blue-700'
                            >
                              {status.booked}
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

                      {status.available > 0 && (
                        <div className='text-green-600'>✓ {status.available} available slots</div>
                      )}

                      {status.booked > 0 && (
                        <div className='text-blue-600'>
                          📚 {status.booked} booked/classes/events
                        </div>
                      )}

                      {status.unavailable > 0 && (
                        <div className='text-red-600'>✕ {status.unavailable} unavailable</div>
                      )}

                      {status.events.length > 0 && (
                        <div className='mt-1 text-xs text-purple-600'>
                          Events:{' '}
                          {status.events
                            .map(e => `${e.title} (${e.startTime}-${e.endTime})`)
                            .join(', ')}
                        </div>
                      )}

                      {status.classes.length > 0 && (
                        <div className='mt-2 text-xs text-gray-600'>
                          Classes: {status.classes.map(c => c.classTitle).join(', ')}
                        </div>
                      )}

                      {status.total === 0 && status.events.length === 0 && (
                        <div className='text-gray-500'>Click to add event</div>
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
              <div className='h-3 w-3 rounded-full bg-green-500' />
              <span>Available Slots</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='h-3 w-3 rounded-full bg-blue-500' />
              <span>Booked/Classes/Events</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='h-3 w-3 rounded-full bg-red-500' />
              <span>Unavailable</span>
            </div>
          </div>

          <div className='text-sm text-gray-600'>Click days to add or edit events</div>
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
