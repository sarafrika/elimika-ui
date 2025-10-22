'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BookOpen, ChevronLeft, ChevronRight, Clock, Edit2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ClassData } from '../../trainings/create-new/academic-period-form';
import { EventModal } from './event-modal';
import { AvailabilityData, CalendarEvent } from './types';

interface WeeklyAvailabilityGridProps {
  availabilityData: AvailabilityData;
  onAvailabilityUpdate: (data: AvailabilityData) => void;
  isEditing: boolean;
  classes: ClassData[];
}

export function WeeklyAvailabilityGrid({
  availabilityData,
  onAvailabilityUpdate,
  isEditing,
  classes,
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
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }

  const getWeekDates = (baseDate: Date) => {
    const dates = [];
    const startOfWeek = new Date(baseDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
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
    // Check for events first
    const event = getEventForSlot(day, time, date);
    if (event) {
      return event.status;
    }

    // Check for existing availability slots
    const slot = availabilityData.slots.find(s => s.day === day && s.startTime === time);

    if (slot) {
      return slot.status;
    }

    // Check for scheduled classes
    const hasClass = classes.some(classItem => {
      if (classItem.status !== 'published') return false;

      return classItem.timetable.timeSlots.some(timeSlot => {
        const classDate = new Date(date);
        const isCorrectDay = timeSlot.day.toLowerCase() === day.toLowerCase();
        const isCorrectTime = timeSlot.startTime === time;

        // Check if the class is within the academic period
        const isWithinPeriod =
          classDate >= new Date(classItem.academicPeriod.startDate) &&
          classDate <= new Date(classItem.academicPeriod.endDate);

        return isCorrectDay && isCorrectTime && isWithinPeriod;
      });
    });

    if (hasClass) {
      return 'booked';
    }

    return null;
  };

  // availability slots
  const getAvailabilityForSlot = (day: string, time: string) => {
    return availabilityData.slots.find(slot => {
      if (slot.day.toLowerCase() !== day.toLowerCase()) return false;

      const slotTime = new Date(`2000-01-01T${time}:00`);
      const start = new Date(`2000-01-01T${slot.startTime}:00`);
      const end = new Date(`2000-01-01T${slot.endTime}:00`);

      return slotTime >= start && slotTime < end && slot.status === 'available';
    });
  };

  const isAvailabilityStartSlot = (day: string, time: string) => {
    return availabilityData.slots.some(
      slot =>
        slot.day.toLowerCase() === day.toLowerCase() &&
        slot.startTime === time &&
        slot.status === 'available'
    );
  };

  const getAvailabilitySpanHeight = (slot: any) => {
    const start = new Date(`2000-01-01T${slot.startTime}:00`);
    const end = new Date(`2000-01-01T${slot.endTime}:00`);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return Math.ceil(durationMinutes / 30); // how many half-hour slots
  };

  // unavailable slots
  const getUnavailableForSlot = (day: string, time: string) => {
    return availabilityData.slots.find(slot => {
      if (slot.day.toLowerCase() !== day.toLowerCase()) return false;

      const slotTime = new Date(`2000-01-01T${time}:00`);
      const start = new Date(`2000-01-01T${slot.startTime}:00`);
      const end = new Date(`2000-01-01T${slot.endTime}:00`);

      return slotTime >= start && slotTime < end && slot.status === 'unavailable';
    });
  };

  const isUnavailableStartSlot = (day: string, time: string) => {
    return availabilityData.slots.some(
      slot =>
        slot.day.toLowerCase() === day.toLowerCase() &&
        slot.startTime === time &&
        slot.status === 'unavailable'
    );
  };

  const getUnavailableSpanHeight = (slot: any) => {
    const start = new Date(`2000-01-01T${slot.startTime}:00`);
    const end = new Date(`2000-01-01T${slot.endTime}:00`);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return Math.ceil(durationMinutes / 30);
  };

  // event slots
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

  const isEventStartSlot = (day: string, time: string, date: Date) => {
    const event = getEventForSlot(day, time, date);
    if (!event) return false;

    return event.startTime === time;
  };

  const getEventSpanHeight = (event: CalendarEvent) => {
    const startTime = new Date(`2000-01-01T${event.startTime}:00`);
    const endTime = new Date(`2000-01-01T${event.endTime}:00`);
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const slots = Math.ceil(durationMinutes / 30); // 30-minute slots
    return slots;
  };

  const shouldSkipSlot = (day: string, time: string, date: Date) => {
    const event = getEventForSlot(day, time, date);
    if (!event) return false;

    // Skip if this slot is part of an event but not the starting slot
    return event.startTime !== time;
  };

  const getSlotClass = (status: string | null, isEventSlot = false) => {
    const baseClasses =
      'w-full h-8 border border-gray-200 rounded text-xs transition-colors cursor-pointer';

    if (isEventSlot) {
      return `${baseClasses} bg-blue-50 border-blue-300 hover:bg-blue-100 shadow-sm`;
    }

    switch (status) {
      case 'available':
        return `${baseClasses} bg-green-100 border-green-300 hover:bg-green-200`;
      case 'unavailable':
        return `${baseClasses} bg-red-100 border-red-300 hover:bg-red-200`;
      case 'reserved':
        return `${baseClasses} bg-yellow-100 border-yellow-300 hover:bg-yellow-200`;
      case 'booked':
        return `${baseClasses} bg-blue-100 border-blue-300 hover:bg-blue-200`;
      default:
        return `${baseClasses} bg-gray-50 hover:bg-gray-100`;
    }
  };

  const handleSlotClick = (day: string, time: string, date: Date) => {
    // Check if there's an existing event for this slot
    const existingEvent = getEventForSlot(day, time, date);

    if (existingEvent) {
      // Open modal to edit existing event
      setSelectedEvent(existingEvent);
      setSelectedSlot(null);
    } else {
      // Open modal to create new event
      setSelectedEvent(null);
      setSelectedSlot({ day, time, date });
    }

    setIsEventModalOpen(true);
  };

  const getEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = Number(minutes) + 30;
    if (endMinutes >= 60) {
      return `${(Number(hours) + 1).toString().padStart(2, '0')}:00`;
    }
    return `${hours?.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (day: string, time: string) => {
    if (!isEditing) return;
    setIsDragging(true);
    setDragStart({ day, time });
  };

  const handleMouseEnter = (day: string, time: string) => {
    if (!isDragging || !dragStart) return;

    // Add logic for drag selection
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

  const getClassesForSlot = (day: string, time: string, date: Date) => {
    return classes.filter(classItem => {
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
    <div className='space-y-4' onMouseUp={handleMouseUp}>
      {/* Week Navigation */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='outline' size='sm' onClick={() => navigateWeek('prev')}>
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <h3 className='font-medium'>
            Week of {weekDates[0]?.toLocaleDateString()} - {weekDates[6]?.toLocaleDateString()}
          </h3>
          <Button variant='outline' size='sm' onClick={() => navigateWeek('next')}>
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
              Clear Week
            </Button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className='overflow-hidden rounded-lg border'>
        {/* Header Row */}
        <div className='grid grid-cols-8 border-b bg-gray-50'>
          <div className='border-r p-3'>
            <Clock className='h-4 w-4 text-gray-500' />
          </div>
          {days.map((day, index) => (
            <div key={day} className='border-r p-3 text-center last:border-r-0'>
              <div className='text-sm font-medium'>{day}</div>
              <div className='mt-1 text-xs text-gray-500'>
                {weekDates[index]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className='max-h-[600px] overflow-y-auto'>
          {timeSlots.map(time => (
            <div key={time} className='grid grid-cols-8 border-b last:border-b-0'>
              <div className='flex items-center border-r bg-gray-50 p-2 text-xs text-gray-600'>
                {time}
              </div>
              {days.map((day, dayIndex) => {
                const date = weekDates[dayIndex];
                const status = getSlotStatus(day, time, date as any);
                const classesInSlot = getClassesForSlot(day, time, date as any);
                const eventInSlot = getEventForSlot(day, time, date as any);
                const isEventStart = isEventStartSlot(day, time, date as any);
                const skipSlot = shouldSkipSlot(day, time, date as any);

                const availabilitySlot = getAvailabilityForSlot(day, time);
                const isAvailabilityStart = isAvailabilityStartSlot(day, time);

                const unavailableSlot = getUnavailableForSlot(day, time);
                const isUnavailableStart = isUnavailableStartSlot(day, time);

                return (
                  <TooltipProvider key={`${day}-${time}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className='relative border-r p-1 last:border-r-0'>
                          {skipSlot ? (
                            <div className='h-8 w-full' />
                          ) : (
                            <button
                              className={getSlotClass(status, eventInSlot && isEventStart)}
                              onClick={() => handleSlotClick(day, time, date as any)}
                              onMouseDown={() => handleMouseDown(day, time)}
                              onMouseEnter={() => handleMouseEnter(day, time)}
                              style={
                                // ✅ Available block
                                availabilitySlot && isAvailabilityStart
                                  ? {
                                    height: `${getAvailabilitySpanHeight(availabilitySlot) * 36 + (getAvailabilitySpanHeight(availabilitySlot) - 1) * 8}px`,
                                    zIndex: 1,
                                    position: 'absolute',
                                    top: '4px',
                                    left: '4px',
                                    right: '4px',
                                    backgroundColor: 'rgba(34,197,94,0.3)', // green tint
                                  }
                                  : // ✅ Unavailable block
                                  unavailableSlot && isUnavailableStart
                                    ? {
                                      height: `${getUnavailableSpanHeight(unavailableSlot) * 36 + (getUnavailableSpanHeight(unavailableSlot) - 1) * 8}px`,
                                      zIndex: 1,
                                      position: 'absolute',
                                      top: '4px',
                                      left: '4px',
                                      right: '4px',
                                      backgroundColor: 'rgba(239,68,68,0.3)', // red tint
                                    }
                                    : // ✅ Event block
                                    eventInSlot && isEventStart
                                      ? {
                                        height: `${getEventSpanHeight(eventInSlot) * 36 + (getEventSpanHeight(eventInSlot) - 1) * 8}px`,
                                        zIndex: 10,
                                        position: 'absolute',
                                        top: '4px',
                                        left: '4px',
                                        right: '4px',
                                      }
                                      : {}
                              }
                            >
                              {/* Show event text on top */}
                              {eventInSlot && isEventStart && (
                                <div className='flex h-full flex-col items-center justify-center'>
                                  <Edit2 className='mb-1 h-3 w-3' />
                                  <span className='px-1 text-center text-xs font-medium'>
                                    {eventInSlot.title}
                                  </span>
                                  <span className='mt-1 text-xs text-gray-600'>
                                    {eventInSlot.startTime} - {eventInSlot.endTime}
                                  </span>
                                </div>
                              )}

                              {/* Show availability only once (at the start) */}
                              {availabilitySlot && isAvailabilityStart && !eventInSlot && (
                                <div className='flex h-full flex-col items-center justify-center text-xs font-medium text-green-700'>
                                  Available
                                  <span className='mt-1 text-gray-600'>
                                    {availabilitySlot.startTime} - {availabilitySlot.endTime}
                                  </span>
                                </div>
                              )}

                              {unavailableSlot && isUnavailableStart && !eventInSlot && (
                                <div className='flex h-full flex-col items-center justify-center text-xs font-medium text-red-700'>
                                  Unavailable
                                  <span className='mt-1 text-gray-600'>
                                    {unavailableSlot.startTime} - {unavailableSlot.endTime}
                                  </span>
                                </div>
                              )}

                              {status === 'booked' && classesInSlot.length > 0 && !eventInSlot && (
                                <div className='flex items-center justify-center'>
                                  <BookOpen className='h-3 w-3' />
                                  <span className='ml-1 truncate text-xs'>
                                    {classesInSlot[0]?.classTitle.substring(0, 8)}...
                                  </span>
                                </div>
                              )}
                              {status === 'available' && !eventInSlot && (
                                <div className='flex items-center justify-center'>
                                  <span className='text-green-600'>✓</span>
                                </div>
                              )}
                              {status === 'unavailable' && !eventInSlot && (
                                <div className='flex items-center justify-center'>
                                  <span className='text-red-600'>✕</span>
                                </div>
                              )}
                              {!status && !eventInSlot && (
                                <div className='flex items-center justify-center'>
                                  <Plus className='h-3 w-3 text-gray-400' />
                                </div>
                              )}
                            </button>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className='text-sm'>
                          <div className='font-medium'>
                            {day}, {time}
                          </div>
                          {eventInSlot && (
                            <div className='mt-1 text-xs text-white'>
                              Event: {eventInSlot.title}
                              <br />
                              Duration: {eventInSlot.startTime} - {eventInSlot.endTime}
                            </div>
                          )}
                          <div className='mt-1 text-xs text-white'>
                            Status: {status || 'Click to add event'}
                          </div>
                          {classesInSlot.length > 0 && (
                            <div className='mt-1 text-xs text-white'>
                              Class: {classesInSlot.map(c => c.classTitle).join(', ')}
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className='p-4'>
        <div className='flex items-center justify-between'>
          <div className='text-sm text-gray-600'>
            Click any time slot to add or edit events • Drag to select multiple slots for bulk
            actions
          </div>
          {isEditing && (
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm'>
                Set All Available
              </Button>
              <Button variant='outline' size='sm'>
                Copy Previous Week
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        event={selectedEvent}
        selectedSlot={selectedSlot}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}
