'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, Clock, Edit2, Plus, Search, Settings } from 'lucide-react';
import { useState } from 'react';
import { EventModal, StudentBookingData } from '../../availability/components/event-modal';
import type { AvailabilityData, CalendarEvent } from '../../availability/components/types';

interface TimetableManagerProps {
  availabilityData: AvailabilityData;
  onAvailabilityUpdate: (data: AvailabilityData) => void;
  classes?: any[];
  studentBookingData?: StudentBookingData;
}

type ViewMode = 'Day' | 'Week' | 'Month' | 'Year';

const SLOT_COLOR_MAP = {
  available:
    'bg-success/10 dark:bg-success/20 border-success/30 dark:border-success/40 hover:bg-success/15',
  unavailable:
    'bg-destructive/10 dark:bg-destructive/20 border-destructive/30 dark:border-destructive/40',
  booked: 'bg-info/10 dark:bg-info/20 border-info/30 dark:border-info/40 hover:bg-info/15',
  event:
    'bg-primary/20 dark:bg-primary/30 border-primary/50 dark:border-primary/60 hover:bg-primary/30 shadow-sm',
  default: 'bg-muted/40 dark:bg-muted/50 hove r:bg-muted/60',
};

export default function NewTimetableManager({
  availabilityData,
  onAvailabilityUpdate,
  classes = [],
  studentBookingData,
}: TimetableManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('Week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string;
    time: string;
    date: Date;
  } | null>(null);

  // Extract unique values from classes data
  const uniqueClasses = classes || [];
  const uniqueRooms = [
    ...new Set(
      classes.flatMap(c => c.timetable?.timeSlots?.map((ts: any) => ts.room).filter(Boolean) || [])
    ),
  ];
  const uniqueEquipment = [...new Set(classes.flatMap(c => c.equipment || []))];
  const uniqueInstructors = [
    ...new Set(
      classes.map(c => c.instructor?.display_name || c.instructor?.username).filter(Boolean)
    ),
  ];
  const uniqueEvents = availabilityData.events.filter(e => e.entry_type === 'SCHEDULED_INSTANCE');

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [selectedInstructorFilter, setSelectedInstructorFilter] = useState<string>('all');

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = Array.from({ length: 14 }, (_, i) => `${7 + i}:00`);

  // Helper functions
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

  const weekDates = getWeekDates(currentDate);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const days = viewMode === 'Day' ? 1 : viewMode === 'Week' ? 7 : viewMode === 'Month' ? 30 : 365;
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? days : -days));
    setCurrentDate(newDate);
  };

  const formatDateRange = () => {
    if (viewMode === 'Day') {
      return currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (viewMode === 'Week') {
      const start = weekDates[0];
      const end = weekDates[6];
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (viewMode === 'Month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return currentDate.getFullYear().toString();
  };

  const mapEventTypeToStatus = (entry_type: string) => {
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

  const doesSlotApplyToDate = (slot: any, date: Date) => {
    if (slot.recurring) {
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
      return weekday.toLowerCase() === slot.day.toLowerCase();
    }
    if (slot.date) {
      const slotDate = new Date(slot.date);
      return slotDate.toDateString() === date.toDateString();
    }
    return false;
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
      return classItem.timetable.timeSlots.some((timeSlot: any) => {
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
    return slots;
  };

  const shouldSkipSlot = (day: string, time: string, date: Date) => {
    const event = getEventForSlot(day, time, date);
    if (!event) return false;
    return event.startTime !== time;
  };

  const handleSlotClick = (day: string, time: string, date: Date) => {
    const event = getEventForSlot(day, time, date);

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

  const getSlotClass = (status: string | null, isEventSlot = false) => {
    const baseClasses =
      'w-full h-full border rounded-md text-xs transition-all duration-200 cursor-pointer';

    if (isEventSlot) {
      return `${baseClasses} ${SLOT_COLOR_MAP.event}`;
    }

    switch (status) {
      case 'available':
        return `${baseClasses} ${SLOT_COLOR_MAP.available}`;
      case 'unavailable':
        return `${baseClasses} ${SLOT_COLOR_MAP.unavailable}`;
      case 'booked':
        return `${baseClasses} ${SLOT_COLOR_MAP.booked}`;
      default:
        return `${baseClasses} ${SLOT_COLOR_MAP.default}`;
    }
  };

  return (
    <div className='flex h-[calc(100vh-12rem)] gap-6'>
      {/* Left Sidebar */}
      <aside className='w-64 flex-shrink-0 space-y-6 overflow-y-auto'>
        {/* Working Hours Card */}
        <Card className='p-4'>
          <div className='mb-4 flex items-center justify-between'>
            <h3 className='text-sm font-semibold'>Working Hrs</h3>
            <span className='text-sm font-medium'>
              {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className='mb-4'>
            <div className='relative'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input placeholder='Search' className='pl-9' />
            </div>
          </div>

          <div className='space-y-3'>
            <FilterItem
              label='Classes'
              items={uniqueClasses.map(c => ({
                value: c.uuid,
                label: c.classTitle || c.className,
              }))}
              selectedValue={selectedClassFilter}
              onValueChange={setSelectedClassFilter}
            />
            <FilterItem
              label='Rooms'
              items={uniqueRooms.map(r => ({ value: r, label: r }))}
              selectedValue={selectedRoomFilter}
              onValueChange={setSelectedRoomFilter}
            />
            <FilterItem
              label='Equipment'
              items={[{ value: 'all', label: `${uniqueEquipment.length} items` }]}
              selectedValue='all'
              onValueChange={() => {}}
            />
            <FilterItem
              label='Instructors'
              items={uniqueInstructors.map(i => ({ value: i, label: i }))}
              selectedValue={selectedInstructorFilter}
              onValueChange={setSelectedInstructorFilter}
            />
            <FilterItem
              label='Events'
              items={[{ value: 'all', label: `${uniqueEvents.length} events` }]}
              selectedValue='all'
              onValueChange={() => {}}
            />
          </div>

          <div className='mt-4 border-t pt-4'>
            <button className='text-muted-foreground text-sm'>My List</button>
          </div>
        </Card>

        {/* Tools/More Info Card */}
        <Card className='p-4'>
          <h3 className='mb-4 text-sm font-semibold'>(Tools/more info)</h3>
          <div className='text-muted-foreground space-y-2 text-sm'>
            <div className='flex items-center gap-2'>
              <div className='bg-primary/10 flex h-5 w-5 items-center justify-center rounded-full'>
                <span className='text-xs'>👥</span>
              </div>
              <span>(Students List)</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='bg-primary/10 flex h-5 w-5 items-center justify-center rounded-full'>
                <span className='text-xs'>📍</span>
              </div>
              <span>(Location)</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='bg-primary/10 flex h-5 w-5 items-center justify-center rounded-full'>
                <span className='text-xs'>🏠</span>
              </div>
              <span>(Room)</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='bg-primary/10 flex h-5 w-5 items-center justify-center rounded-full'>
                <span className='text-xs'>🔗</span>
              </div>
              <span>(Meeting Link)</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='bg-primary/10 flex h-5 w-5 items-center justify-center rounded-full'>
                <span className='text-xs'>✉️</span>
              </div>
              <span>(Invite Link)</span>
            </div>
          </div>
        </Card>
      </aside>

      {/* Main Calendar Area */}
      <div className='flex-1 overflow-hidden'>
        <Card className='flex h-full flex-col'>
          {/* Header */}
          <div className='flex items-center justify-between border-b p-4'>
            <div className='flex items-center gap-4'>
              <Button
                variant='outline'
                size='icon'
                onClick={() => navigateWeek('prev')}
                className='h-8 w-8'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <span className='min-w-[200px] text-center text-sm font-medium'>
                {formatDateRange()}
              </span>
              <Button
                variant='outline'
                size='icon'
                onClick={() => navigateWeek('next')}
                className='h-8 w-8'
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant={viewMode === 'Day' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('Day')}
              >
                Day
              </Button>
              <Button
                variant={viewMode === 'Week' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('Week')}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'Month' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('Month')}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'Year' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('Year')}
              >
                Year
              </Button>
            </div>

            <div className='flex items-center gap-2'>
              <Button variant='outline' size='icon' className='h-8 w-8'>
                <Settings className='h-4 w-4' />
              </Button>
              <Button variant='default' size='sm'>
                Create
              </Button>
            </div>
          </div>

          {/* Calendar Grid - Week View */}
          {viewMode === 'Week' && (
            <div className='flex-1 overflow-auto'>
              {/* Weekday Headers */}
              <div className='bg-muted/30 sticky top-0 z-10 grid grid-cols-8 border-b'>
                <div className='bg-muted/50 flex items-center justify-center border-r p-3'>
                  <Clock className='text-muted-foreground h-4 w-4' />
                </div>
                {weekdays.map((day, idx) => {
                  const date = weekDates[idx];
                  const isToday = date?.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={day}
                      className={`border-r p-3 text-center last:border-r-0 ${
                        isToday ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className={`text-xs font-semibold ${isToday ? 'text-primary' : ''}`}>
                        {day.slice(0, 3)}
                      </div>
                      <div
                        className={`mt-1 text-xs ${isToday ? 'text-primary' : 'text-muted-foreground'}`}
                      >
                        {date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      {isToday && (
                        <Badge className='mt-1 h-4 text-xs' variant='default'>
                          Today
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Time Slots */}
              <div className='relative'>
                {timeSlots.map(time => (
                  <div
                    key={time}
                    className='hover:bg-muted/20 grid grid-cols-8 border-b last:border-b-0'
                  >
                    <div className='bg-muted/30 text-muted-foreground flex items-center justify-center border-r p-3 text-xs font-medium'>
                      {time}
                    </div>
                    {weekdays.map((day, dayIdx) => {
                      const date = weekDates[dayIdx];
                      const status = getSlotStatus(day, time, date);
                      const eventInSlot = getEventForSlot(day, time, date);
                      const isEventStart = isEventStartSlot(day, time, date);
                      const skipSlot = shouldSkipSlot(day, time, date);

                      return (
                        <TooltipProvider key={`${day}-${time}`}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className='relative border-r p-1.5 last:border-r-0'
                                style={{ minHeight: '60px' }}
                              >
                                {skipSlot ? (
                                  <div className='h-full w-full' />
                                ) : (
                                  <button
                                    className={getSlotClass(status, eventInSlot && isEventStart)}
                                    onClick={() => handleSlotClick(day, time, date)}
                                    style={
                                      eventInSlot && isEventStart
                                        ? {
                                            height: `${
                                              getEventSpanHeight(eventInSlot) * 60 +
                                              (getEventSpanHeight(eventInSlot) - 1) * 8
                                            }px`,
                                            position: 'absolute',
                                            top: '6px',
                                            left: '6px',
                                            right: '6px',
                                            zIndex: 10,
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
                                    {!status && !eventInSlot && (
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
            </div>
          )}

          {/* Day View */}
          {viewMode === 'Day' && (
            <div className='flex-1 overflow-auto'>
              {/* Day Header */}
              <div className='bg-muted/30 sticky top-0 z-10 grid grid-cols-2 border-b'>
                <div className='bg-muted/50 flex items-center justify-center border-r p-3'>
                  <Clock className='text-muted-foreground h-4 w-4' />
                </div>
                <div
                  className={`p-3 text-center ${currentDate.toDateString() === new Date().toDateString() ? 'bg-primary/5' : ''}`}
                >
                  <div
                    className={`text-sm font-semibold ${currentDate.toDateString() === new Date().toDateString() ? 'text-primary' : ''}`}
                  >
                    {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </div>
                  <div
                    className={`mt-1 text-xs ${currentDate.toDateString() === new Date().toDateString() ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {currentDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  {currentDate.toDateString() === new Date().toDateString() && (
                    <Badge className='mt-1 h-4 text-xs' variant='default'>
                      Today
                    </Badge>
                  )}
                </div>
              </div>

              {/* Time Slots */}
              <div className='relative'>
                {timeSlots.map(time => {
                  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
                  const status = getSlotStatus(dayName, time, currentDate);
                  const eventInSlot = getEventForSlot(dayName, time, currentDate);
                  const isEventStart = isEventStartSlot(dayName, time, currentDate);
                  const skipSlot = shouldSkipSlot(dayName, time, currentDate);

                  return (
                    <div
                      key={time}
                      className='hover:bg-muted/20 grid grid-cols-2 border-b last:border-b-0'
                    >
                      <div className='bg-muted/30 text-muted-foreground flex items-center justify-center border-r p-4 text-sm font-medium'>
                        {time}
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className='relative p-2' style={{ minHeight: '70px' }}>
                              {skipSlot ? (
                                <div className='h-full w-full' />
                              ) : (
                                <button
                                  className={getSlotClass(status, eventInSlot && isEventStart)}
                                  onClick={() => handleSlotClick(dayName, time, currentDate)}
                                  style={
                                    eventInSlot && isEventStart
                                      ? {
                                          height: `${getEventSpanHeight(eventInSlot) * 70 + (getEventSpanHeight(eventInSlot) - 1) * 8}px`,
                                          position: 'absolute',
                                          top: '8px',
                                          left: '8px',
                                          right: '8px',
                                          zIndex: 10,
                                        }
                                      : {}
                                  }
                                >
                                  {eventInSlot && isEventStart && (
                                    <div className='flex h-full flex-col items-center justify-center p-3'>
                                      <Edit2 className='text-primary mb-2 h-4 w-4' />
                                      <span className='text-foreground line-clamp-2 px-2 text-center text-sm font-medium italic'>
                                        {eventInSlot.title}
                                      </span>
                                      <span className='text-muted-foreground mt-2 text-xs font-bold'>
                                        {eventInSlot.startTime} - {eventInSlot.endTime}
                                      </span>
                                    </div>
                                  )}
                                  {!status && !eventInSlot && (
                                    <div className='flex h-full items-center justify-center opacity-0 transition-opacity hover:opacity-100'>
                                      <Plus className='text-muted-foreground h-4 w-4' />
                                    </div>
                                  )}
                                </button>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side='right' className='max-w-xs'>
                            <div className='text-foreground space-y-1 text-sm'>
                              <div className='font-medium'>{time}</div>
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Month View */}
          {viewMode === 'Month' && (
            <div className='flex-1 overflow-auto p-4'>
              {/* Month Calendar Grid */}
              <div className='space-y-4'>
                {/* Weekday Headers */}
                <div className='bg-muted/30 grid grid-cols-7 gap-px rounded-lg border'>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div
                      key={day}
                      className='bg-background text-muted-foreground p-3 text-center text-sm font-semibold'
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className='bg-muted/30 grid grid-cols-7 gap-px rounded-lg border'>
                  {(() => {
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth();
                    const firstDay = new Date(year, month, 1);
                    const lastDay = new Date(year, month + 1, 0);
                    const startDate = new Date(firstDay);
                    const endDate = new Date(lastDay);

                    const startDay = startDate.getDay();
                    const daysToSubtract = startDay === 0 ? 6 : startDay - 1;
                    startDate.setDate(startDate.getDate() - daysToSubtract);

                    const endDay = endDate.getDay();
                    const daysToAdd = endDay === 0 ? 0 : 7 - endDay;
                    endDate.setDate(endDate.getDate() + daysToAdd);

                    const days = [];
                    const current = new Date(startDate);

                    while (current <= endDate) {
                      days.push(new Date(current));
                      current.setDate(current.getDate() + 1);
                    }

                    return days.map((date, index) => {
                      const isCurrentMonth = date.getMonth() === month;
                      const isToday = date.toDateString() === new Date().toDateString();
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

                      // Get events for this day
                      const dayEvents = availabilityData.events.filter(event => {
                        if (event.date) {
                          const eventDate = new Date(event.date);
                          return eventDate.toDateString() === date.toDateString();
                        }
                        return false;
                      });

                      const bookedEvents = dayEvents.filter(
                        e => e.entry_type === 'SCHEDULED_INSTANCE'
                      );
                      const blockedEvents = dayEvents.filter(e => e.entry_type === 'BLOCKED');

                      return (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`group bg-background hover:bg-muted/50 relative min-h-[100px] cursor-pointer p-3 transition-all ${
                                  isToday ? 'ring-primary ring-2' : ''
                                } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                                onClick={() => handleSlotClick(dayName, '09:00', date)}
                              >
                                {/* Date Number */}
                                <div className='mb-2 flex items-center justify-between'>
                                  <span
                                    className={`text-sm font-semibold ${
                                      isToday
                                        ? 'bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-full'
                                        : !isCurrentMonth
                                          ? 'text-muted-foreground/60'
                                          : 'text-foreground'
                                    }`}
                                  >
                                    {date.getDate()}
                                  </span>

                                  {/* Status Dots */}
                                  {dayEvents.length > 0 && (
                                    <div className='flex gap-1'>
                                      {bookedEvents.length > 0 && (
                                        <div className='bg-info h-2 w-2 rounded-full' />
                                      )}
                                      {blockedEvents.length > 0 && (
                                        <div className='bg-destructive h-2 w-2 rounded-full' />
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Event Previews */}
                                <div className='space-y-1'>
                                  {dayEvents.slice(0, 2).map(event => {
                                    const colors =
                                      event.entry_type === 'SCHEDULED_INSTANCE'
                                        ? 'bg-info/10 text-info border-info/20'
                                        : event.entry_type === 'BLOCKED'
                                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                                          : 'bg-success/10 text-success border-success/20';

                                    return (
                                      <div
                                        key={event.id}
                                        className={`truncate rounded-md border px-2 py-1 text-xs font-medium ${colors}`}
                                      >
                                        <div className='flex items-center gap-1'>
                                          <Clock className='h-2.5 w-2.5 flex-shrink-0' />
                                          <span className='truncate'>
                                            {event.title || event.entry_type}
                                          </span>
                                        </div>
                                        <div className='mt-0.5 text-xs opacity-75'>
                                          {event.startTime}
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {dayEvents.length > 2 && (
                                    <div className='text-muted-foreground py-1 text-center text-xs font-medium'>
                                      +{dayEvents.length - 2} more
                                    </div>
                                  )}
                                </div>

                                {/* Count Badges */}
                                {(bookedEvents.length > 0 || blockedEvents.length > 0) && (
                                  <div className='absolute right-2 bottom-2 flex gap-1'>
                                    {bookedEvents.length > 0 && (
                                      <Badge className='bg-info/10 text-info border-info/20 h-5 text-xs'>
                                        {bookedEvents.length}
                                      </Badge>
                                    )}
                                    {blockedEvents.length > 0 && (
                                      <Badge className='bg-destructive/10 text-destructive border-destructive/20 h-5 text-xs'>
                                        {blockedEvents.length}
                                      </Badge>
                                    )}
                                  </div>
                                )}

                                {/* Hover Add Icon */}
                                {dayEvents.length === 0 && (
                                  <div className='absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100'>
                                    <Plus className='text-muted-foreground h-6 w-6' />
                                  </div>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side='top' className='max-w-xs'>
                              <div className='space-y-2 text-sm'>
                                <div className='text-foreground font-semibold'>
                                  {date.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </div>

                                {bookedEvents.length > 0 && (
                                  <div className='text-info flex items-center gap-2'>
                                    <div className='bg-info h-2 w-2 rounded-full' />
                                    <span>{bookedEvents.length} booked event(s)</span>
                                  </div>
                                )}

                                {blockedEvents.length > 0 && (
                                  <div className='text-destructive flex items-center gap-2'>
                                    <div className='bg-destructive h-2 w-2 rounded-full' />
                                    <span>{blockedEvents.length} blocked slot(s)</span>
                                  </div>
                                )}

                                {dayEvents.length > 0 && (
                                  <div className='border-border space-y-1 border-t pt-2 text-xs'>
                                    <div className='text-foreground font-medium'>Events:</div>
                                    {dayEvents.slice(0, 3).map(e => (
                                      <div key={e.id} className='text-muted-foreground'>
                                        • {e.title} ({e.startTime}-{e.endTime})
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {dayEvents.length === 0 && (
                                  <div className='text-muted-foreground text-xs'>
                                    Click to add event
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'Year' && (
            <div className='text-muted-foreground flex h-full items-center justify-center'>
              <p>Year view - Coming soon</p>
            </div>
          )}
        </Card>
      </div>

      {/* Event Modal */}
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

interface FilterItemProps {
  label: string;
  items: { value: string; label: string }[];
  selectedValue: string;
  onValueChange: (value: string) => void;
}

function FilterItem({ label, items, selectedValue, onValueChange }: FilterItemProps) {
  return (
    <div className='flex items-center justify-between'>
      <span className='text-sm'>{label}</span>
      <div className='flex items-center gap-2'>
        <Badge variant='secondary' className='h-5 min-w-[2rem] justify-center px-2'>
          {items.length}
        </Badge>
        <Select value={selectedValue} onValueChange={onValueChange}>
          <SelectTrigger className='h-6 w-24 text-xs'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            {items.map(item => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
