'use client';

import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Home,
  Info,
  MapPin,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react';
import type React from 'react';

import { Button } from '@/components/ui/button';
import type {
  CalendarEvent,
  ScheduleFilterSection,
  StudentEnrollment,
  ViewMode,
} from '@/components/schedule/types';

export const COLOR_PALETTE = [
  'rgb(59 130 246)',
  'rgb(139 92 246)',
  'rgb(236 72 153)',
  'rgb(16 185 129)',
  'rgb(245 158 11)',
  'rgb(239 68 68)',
  'rgb(6 182 212)',
  'rgb(139 90 0)',
  'rgb(99 102 241)',
  'rgb(20 184 166)',
];

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-muted animate-pulse rounded ${className}`} />
);

const REQUEST_EVENT_STYLES = {
  backgroundColor: 'rgba(245, 158, 11, 0.12)',
  borderColor: 'rgba(245, 158, 11, 0.7)',
  color: 'rgb(146, 64, 14)',
};

const isBookingRequestEvent = (event: CalendarEvent) => event.eventType === 'booking_request';

const getVisibleWeekDays = (showWeekends: boolean) =>
  [
    { label: 'Mon', dayOffset: 0 },
    { label: 'Tue', dayOffset: 1 },
    { label: 'Wed', dayOffset: 2 },
    { label: 'Thu', dayOffset: 3 },
    { label: 'Fri', dayOffset: 4 },
    { label: 'Sat', dayOffset: 5 },
    { label: 'Sun', dayOffset: 6 },
  ].filter(day => showWeekends || day.dayOffset < 5);

const Dropdown: React.FC<{
  label: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  items?: { id: string; name: string }[];
  onItemClick?: (id: string) => void;
  selectedId?: string | null;
}> = ({ label, count, isOpen, onToggle, items, onItemClick, selectedId }) => (
  <div className='border-border border-b'>
    <button
      type='button'
      onClick={onToggle}
      className='hover:bg-primary/5 flex w-full items-center justify-between px-4 py-2.5 transition-colors md:px-5 md:py-3'
    >
      <span className='text-foreground text-xs font-medium tracking-wide uppercase md:text-sm'>
        {label}
      </span>
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground text-xs font-semibold md:text-sm'>{count}</span>
        <ChevronDown
          className={`text-muted-foreground h-3 w-3 transition-transform md:h-4 md:w-4 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
    </button>

    {isOpen && items && (
      <div className='scrollbar-hide max-h-64 space-y-1.5 overflow-y-auto px-4 pb-3 md:px-5'>
        {items.map(item => (
          <div
            key={item.id}
            className={`flex cursor-pointer items-center justify-between rounded px-2.5 py-1.5 text-xs transition-colors md:text-sm ${
              selectedId === item.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-primary/5'
            }`}
            onClick={() => onItemClick?.(item.id)}
          >
            <span className='truncate'>{item.name}</span>
            {selectedId === item.id && (
              <Check className='text-primary ml-2 h-3.5 w-3.5 flex-shrink-0' />
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

export const ScheduleFiltersPanel: React.FC<{
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeFilterCount: number;
  onClearFilters: () => void;
  sections: ScheduleFilterSection[];
}> = ({ searchQuery, onSearchChange, activeFilterCount, onClearFilters, sections }) => (
  <div className='flex h-full flex-col overflow-hidden'>
    <div className='border-border border-b p-3 md:p-4'>
      <div className='relative'>
        <Search className='text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
        <input
          type='text'
          placeholder='Search classes...'
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className='border-input focus:ring-ring bg-background text-foreground w-full rounded-lg border py-2 pr-3 pl-9 text-sm focus:border-transparent focus:ring-2 focus:outline-none'
        />
      </div>
    </div>

    {activeFilterCount > 0 && (
      <div className='border-border border-b p-3 md:p-4'>
        <div className='flex items-center justify-between gap-3'>
          <span className='text-muted-foreground text-xs font-medium md:text-sm'>
            {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} applied
          </span>
          <Button variant='ghost' size='sm' onClick={onClearFilters} className='h-8 px-2 text-xs'>
            Clear all
          </Button>
        </div>
      </div>
    )}

    <div className='scrollbar-hide flex-1 overflow-y-auto'>
      {sections.map(section => (
        <Dropdown
          key={section.key}
          label={section.label}
          count={section.count}
          isOpen={section.isOpen}
          onToggle={section.onToggle}
          items={section.items}
          onItemClick={section.onItemClick}
          selectedId={section.selectedId}
        />
      ))}
    </div>
  </div>
);

export const ScheduleCompactActions: React.FC<{
  activeFilterCount: number;
  hasSelectedEvent: boolean;
  onOpenFilters: () => void;
  onOpenDetails: () => void;
}> = ({ activeFilterCount, hasSelectedEvent, onOpenFilters, onOpenDetails }) => (
  <div className='border-border bg-background absolute inset-x-0 top-0 z-20 border-b px-3 py-2 max-[1550px]:block min-[1551px]:hidden md:px-4'>
    <div className='flex items-center gap-2 overflow-x-auto pb-1'>
      <Button variant='outline' size='sm' onClick={onOpenFilters} className='shrink-0'>
        <Filter className='h-4 w-4' />
        Classes
      </Button>
      <Button
        variant='outline'
        size='sm'
        onClick={onOpenDetails}
        className='shrink-0'
        disabled={!hasSelectedEvent}
      >
        <Info className='h-4 w-4' />
        Session details
      </Button>
      {activeFilterCount > 0 && (
        <div className='bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap'>
          {activeFilterCount} active
        </div>
      )}
    </div>
  </div>
);

export const ScheduleCalendarHeader: React.FC<{
  currentDate: Date;
  viewMode: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onDateChange: (direction: 'prev' | 'next') => void;
  eventCount: number;
  workingHoursLabel?: string;
  onWorkingHoursClick?: () => void;
  onSettingsClick?: () => void;
}> = ({
  currentDate,
  viewMode,
  onViewChange,
  onDateChange,
  eventCount,
  workingHoursLabel,
  onWorkingHoursClick,
  onSettingsClick,
}) => {
  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return currentDate.toLocaleDateString('en-US', options);
  };

  return (
    <div className='bg-background border-border border-b px-4 pb-3 md:px-6 md:py-3'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center md:gap-6'>
          <h1 className='text-foreground text-lg font-bold tracking-tight md:text-xl'>
            Class Schedule
          </h1>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => onDateChange('prev')}
              className='hover:bg-primary/5 rounded-lg p-1.5 transition-colors'
            >
              <ChevronLeft className='text-muted-foreground h-4 w-4' />
            </button>
            <span className='text-foreground min-w-[130px] text-center text-xs font-semibold md:min-w-[160px] md:text-sm'>
              {formatDate()}
            </span>
            <button
              type='button'
              onClick={() => onDateChange('next')}
              className='hover:bg-primary/5 rounded-lg p-1.5 transition-colors'
            >
              <ChevronRight className='text-muted-foreground h-4 w-4' />
            </button>
          </div>
          <div className='bg-muted flex items-center gap-1 overflow-x-auto rounded-lg p-0.5'>
            {(['day', 'week', 'month', 'year'] as ViewMode[]).map(view => (
              <button
                key={view}
                type='button'
                onClick={() => onViewChange(view)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all md:px-3.5 md:text-sm ${
                  viewMode === view
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='rounded-full px-4'
            onClick={onWorkingHoursClick}
          >
            <Clock className='h-3.5 w-3.5' />
            {workingHoursLabel || 'Working hours'}
          </Button>
        </div>
        <div className='flex items-center justify-between gap-3 md:justify-end'>
          <div className='bg-primary/10 flex items-center gap-2 rounded-lg px-2.5 py-1.5'>
            <Calendar className='text-primary h-3.5 w-3.5' />
            <span className='text-primary text-xs font-semibold md:text-sm'>
              {eventCount} {eventCount === 1 ? 'Session' : 'Sessions'}
            </span>
          </div>
          <button
            type='button'
            className='hover:bg-primary/5 rounded-lg p-1.5 transition-colors'
            onClick={onSettingsClick}
          >
            <Settings className='text-muted-foreground h-4 w-4' />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ScheduleWeekView: React.FC<{
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  selectedEvent: CalendarEvent | null;
  currentDate: Date;
  onDateSelect?: (date: Date) => void;
  showWeekends?: boolean;
  onTimeSlotSelect?: (slot: { startTime: Date; endTime: Date }) => void;
}> = ({
  events,
  onEventSelect,
  selectedEvent,
  currentDate,
  onDateSelect,
  showWeekends = true,
  onTimeSlotSelect,
}) => {
  const hours = Array.from({ length: 18 }, (_, i) => i + 4);

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(currentDate);
  const weekDaysWithDates = getVisibleWeekDays(showWeekends).map(({ label, dayOffset }) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayOffset);
    return { day: label, date, dayOffset };
  });

  const getEventsForDayAndHour = (dayIndex: number, hour: number) => {
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + dayIndex);

    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      const eventHour = eventDate.getHours();
      return eventDate.toDateString() === targetDate.toDateString() && eventHour === hour;
    });
  };

  const getEventHeight = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    return durationHours * 60;
  };

  const getEventTop = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const minutes = start.getMinutes();
    return (minutes / 60) * 60;
  };

  const createSlotRange = (date: Date, hour: number) => {
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(hour + 1, 0, 0, 0);
    return { startTime, endTime };
  };

  return (
    <div className='scrollbar-hide flex-1 overflow-auto'>
      <div className='space-y-3 p-3 max-[1550px]:block min-[1551px]:hidden md:p-5'>
        {weekDaysWithDates.map(({ day, date }) => {
          const dayEvents = events
            .filter(event => new Date(event.startTime).toDateString() === date.toDateString())
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

          return (
            <div key={day} className='border-border bg-card rounded-xl border p-3 shadow-sm'>
              <div className='mb-3 flex items-center justify-between gap-3'>
                <button
                  type='button'
                  onClick={() => onDateSelect?.(date)}
                  className='hover:text-primary text-left transition-colors'
                >
                  <div className='text-foreground text-sm font-semibold'>{day}</div>
                  <div className='text-muted-foreground text-xs'>
                    {date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </button>
                <div className='bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium'>
                  {dayEvents.length} {dayEvents.length === 1 ? 'session' : 'sessions'}
                </div>
              </div>

              {dayEvents.length > 0 ? (
                <div className='space-y-2'>
                  {dayEvents.map(event => (
                    <button
                      key={event.id}
                      type='button'
                      onClick={() => onEventSelect(event)}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${
                        selectedEvent?.id === event.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background hover:border-primary/40 hover:bg-primary/5'
                      }`}
                      style={
                        isBookingRequestEvent(event)
                          ? REQUEST_EVENT_STYLES
                          : undefined
                      }
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0'>
                          <div className='truncate text-sm font-semibold'>
                            {isBookingRequestEvent(event) ? 'Booking request' : event.title}
                          </div>
                          <div className='truncate text-xs opacity-80'>
                            {event.courseName || event.studentName || event.requestSource}
                          </div>
                        </div>
                        {isBookingRequestEvent(event) ? (
                          <span className='border-warning/70 text-warning-foreground rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase'>
                            Request
                          </span>
                        ) : (
                          <span
                            className='mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full'
                            style={{ backgroundColor: event.color }}
                          />
                        )}
                      </div>
                      <div className='mt-2 text-xs opacity-80'>
                        {new Date(event.startTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(event.endTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className='mt-1 truncate text-xs opacity-75'>{event.location}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type='button'
                  className='text-muted-foreground hover:border-primary/40 hover:bg-primary/5 w-full rounded-xl border border-dashed px-3 py-6 text-center text-sm transition-colors'
                  onClick={() => onTimeSlotSelect?.(createSlotRange(date, 9))}
                >
                  No sessions scheduled. Tap to create a class.
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div
        className={`hidden min-[1551px]:block ${showWeekends ? 'min-[1551px]:min-w-[980px]' : 'min-[1551px]:min-w-[760px]'}`}
      >
        <div
          className='border-border bg-muted sticky top-0 z-10 border-b'
          style={{
            display: 'grid',
            gridTemplateColumns: `84px repeat(${weekDaysWithDates.length}, minmax(120px, 1fr))`,
          }}
        >
          <div className='text-muted-foreground p-2 text-xs font-semibold md:p-3 md:text-sm'>
            Time
          </div>
          {weekDaysWithDates.map(({ day, date }) => (
            <button
              key={day}
              type='button'
              onClick={() => onDateSelect?.(date)}
              className='border-border hover:bg-primary/5 border-l p-2 transition-colors md:p-3'
            >
              <div className='text-foreground text-center text-xs font-semibold md:text-sm'>
                {day}
              </div>
              <div className='text-muted-foreground mt-0.5 text-center text-xs'>
                {date.getDate()}
              </div>
            </button>
          ))}
        </div>
        <div className='relative'>
          {hours.map(hour => (
            <div
              key={hour}
              className='border-border/50 border-b'
              style={{
                display: 'grid',
                gridTemplateColumns: `84px repeat(${weekDaysWithDates.length}, minmax(120px, 1fr))`,
              }}
            >
              <div className='text-muted-foreground p-2 text-xs font-medium md:p-3 md:text-sm'>
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDaysWithDates.map(({ dayOffset, date }) => {
                const dayEvents = getEventsForDayAndHour(dayOffset, hour);
                const isStartHour = dayEvents.some(e => new Date(e.startTime).getHours() === hour);

                return (
                  <button
                    key={dayOffset}
                    type='button'
                    className='border-border/50 hover:bg-primary/5 relative border-l text-left transition-colors'
                    style={{ height: '60px' }}
                    onClick={() => onTimeSlotSelect?.(createSlotRange(date, hour))}
                  >
                    {isStartHour &&
                      dayEvents.map((event, eventIdx) => {
                        const eventStartHour = new Date(event.startTime).getHours();
                        if (eventStartHour !== hour) return null;

                        return (
                          <div
                            key={event.id}
                            className={`absolute overflow-hidden rounded-lg border p-1.5 transition-all hover:shadow-lg md:p-2 ${
                              selectedEvent?.id === event.id ? 'ring-ring ring-2' : ''
                            }`}
                            style={{
                              backgroundColor: isBookingRequestEvent(event)
                                ? REQUEST_EVENT_STYLES.backgroundColor
                                : event.color,
                              borderColor: isBookingRequestEvent(event)
                                ? REQUEST_EVENT_STYLES.borderColor
                                : event.color,
                              color: isBookingRequestEvent(event) ? REQUEST_EVENT_STYLES.color : 'white',
                              height: `${getEventHeight(event)}px`,
                              top: `${getEventTop(event)}px`,
                              left: `${4 + eventIdx * 2}px`,
                              right: '4px',
                              zIndex: eventIdx + 1,
                            }}
                            onClick={slotEvent => {
                              slotEvent.stopPropagation();
                              onEventSelect(event);
                            }}
                          >
                            <div className='truncate text-[10px] font-semibold md:text-xs'>
                              {isBookingRequestEvent(event) ? 'Booking request' : event.title}
                            </div>
                            <div className='truncate text-[9px] opacity-90 md:text-xs'>
                              {event.courseName || event.studentName || event.requestSource}
                            </div>
                            <div className='mt-0.5 truncate text-[9px] opacity-75 md:text-xs'>
                              {new Date(event.startTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ScheduleDayView: React.FC<{
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  selectedEvent: CalendarEvent | null;
  currentDate: Date;
  onTimeSlotSelect?: (slot: { startTime: Date; endTime: Date }) => void;
}> = ({ events, onEventSelect, selectedEvent, currentDate, onTimeSlotSelect }) => {
  const hours = Array.from({ length: 18 }, (_, i) => i + 4);

  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === currentDate.toDateString();
  });

  const getEventsForHour = (hour: number) =>
    dayEvents.filter(event => new Date(event.startTime).getHours() === hour);

  const getEventHeight = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    return durationHours * 60;
  };

  const createSlotRange = (hour: number) => {
    const startTime = new Date(currentDate);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(hour + 1, 0, 0, 0);
    return { startTime, endTime };
  };

  return (
    <div className='scrollbar-hide flex-1 overflow-auto'>
      <div className='relative'>
        {hours.map(hour => {
          const hourEvents = getEventsForHour(hour);
          return (
            <div key={hour} className='border-border/50 flex border-b' style={{ height: '60px' }}>
              <div className='text-muted-foreground w-16 p-2 text-xs font-medium md:w-20 md:p-3 md:text-sm'>
                {hour.toString().padStart(2, '0')}:00
              </div>

              <button
                type='button'
                className='hover:bg-primary/5 relative flex-1 p-2 text-left transition-colors'
                onClick={() => onTimeSlotSelect?.(createSlotRange(hour))}
              >
                {hourEvents.map((event, idx) => (
                  <div
                    key={event.id}
                    className={`absolute rounded-lg border p-2 transition-all hover:shadow-lg md:p-3 ${
                      selectedEvent?.id === event.id ? 'ring-ring ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: isBookingRequestEvent(event)
                        ? REQUEST_EVENT_STYLES.backgroundColor
                        : event.color,
                      borderColor: isBookingRequestEvent(event)
                        ? REQUEST_EVENT_STYLES.borderColor
                        : event.color,
                      color: isBookingRequestEvent(event) ? REQUEST_EVENT_STYLES.color : 'white',
                      height: `${getEventHeight(event)}px`,
                      left: `${8 + idx * 4}px`,
                      right: '0px',
                      top: '0px',
                      zIndex: idx + 1,
                    }}
                    onClick={slotEvent => {
                      slotEvent.stopPropagation();
                      onEventSelect(event);
                    }}
                  >
                    <div className='text-sm font-semibold md:text-base'>
                      {isBookingRequestEvent(event) ? 'Booking request' : event.title}
                    </div>
                    <div className='mt-0.5 text-xs opacity-90 md:text-sm'>
                      {event.courseName || event.studentName || event.requestSource}
                    </div>
                    <div className='text-xs opacity-90 md:text-sm'>{event.instructor}</div>
                    <div className='text-xs opacity-90 md:text-sm'>{event.location}</div>
                  </div>
                ))}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ScheduleMonthView: React.FC<{
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  currentDate: Date;
  onDateSelect?: (date: Date) => void;
  showWeekends?: boolean;
}> = ({ events, onEventSelect, currentDate, onDateSelect }) => {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDay = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === targetDate.toDateString();
    });
  };

  return (
    <div className='scrollbar-hide flex-1 overflow-auto p-3 md:p-5'>
      <div className='space-y-3 max-[1550px]:block min-[1551px]:hidden'>
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNumber = i + 1;
          const dayEvents = getEventsForDay(dayNumber);
          const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);

          if (dayEvents.length === 0) return null;

          return (
            <div key={dayNumber} className='border-border bg-card rounded-xl border p-3 shadow-sm'>
              <div className='mb-3 flex items-center justify-between gap-3'>
                <button
                  type='button'
                  onClick={() => onDateSelect?.(targetDate)}
                  className='hover:text-primary text-left transition-colors'
                >
                  <div className='text-foreground text-sm font-semibold'>
                    {targetDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className='text-muted-foreground text-xs'>
                    {dayEvents.length} {dayEvents.length === 1 ? 'session' : 'sessions'}
                  </div>
                </button>
              </div>
              <div className='space-y-2'>
                {dayEvents.map(event => (
                  <button
                    key={event.id}
                    type='button'
                    onClick={() => onEventSelect(event)}
                    className='border-border bg-background hover:border-primary/40 hover:bg-primary/5 flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors'
                  >
                    <div className='min-w-0'>
                      <div className='text-foreground truncate text-sm font-semibold'>
                        {event.title}
                      </div>
                      <div className='text-muted-foreground truncate text-xs'>
                        {event.courseName}
                      </div>
                      <div className='text-muted-foreground mt-1 text-xs'>
                        {new Date(event.startTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <span
                      className='h-2.5 w-2.5 flex-shrink-0 rounded-full'
                      style={{ backgroundColor: event.color }}
                    />
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {!events.length && (
          <div className='text-muted-foreground rounded-xl border border-dashed px-4 py-10 text-center text-sm'>
            No sessions scheduled this month.
          </div>
        )}
      </div>

      <div className='hidden min-[1551px]:grid min-[1551px]:grid-cols-7 min-[1551px]:gap-3'>
        {days.map(day => (
          <div
            key={day}
            className='text-muted-foreground pb-1.5 text-center text-xs font-semibold md:text-sm'
          >
            {day}
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNumber = i + 1;
          const dayEvents = getEventsForDay(dayNumber);
          const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);

          return (
            <div
              key={dayNumber}
              className='border-border hover:border-ring hover:bg-primary/5 min-h-[70px] rounded-lg border p-2 transition-colors md:min-h-[100px]'
              onClick={() => onDateSelect?.(targetDate)}
            >
              <div className='text-foreground mb-1.5 text-xs font-semibold md:text-sm'>
                {dayNumber}
              </div>
              <div className='space-y-1'>
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className='cursor-pointer truncate rounded border p-1 text-[10px] transition-opacity hover:opacity-80 md:text-xs'
                    style={
                      isBookingRequestEvent(event)
                        ? REQUEST_EVENT_STYLES
                        : { backgroundColor: event.color, borderColor: event.color, color: 'white' }
                    }
                    onClick={e => {
                      e.stopPropagation();
                      onEventSelect(event);
                    }}
                    title={`${event.title} - ${event.courseName}`}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className='text-muted-foreground pl-1 text-[10px] md:text-xs'>
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ScheduleYearView: React.FC<{
  events: CalendarEvent[];
  currentDate: Date;
  onMonthClick: (month: number) => void;
}> = ({ events, currentDate, onMonthClick }) => {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const getEventsForMonth = (monthIndex: number) =>
    events.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getFullYear() === currentDate.getFullYear() && eventDate.getMonth() === monthIndex
      );
    });

  const getDaysInMonth = (monthIndex: number) =>
    new Date(currentDate.getFullYear(), monthIndex + 1, 0).getDate();

  const getFirstDayOfMonth = (monthIndex: number) =>
    new Date(currentDate.getFullYear(), monthIndex, 1).getDay();

  return (
    <div className='scrollbar-hide flex-1 overflow-auto p-3 md:p-5'>
      <div className='mx-auto grid max-w-[1400px] grid-cols-1 gap-3 min-[1551px]:grid-cols-4 sm:grid-cols-2 md:gap-4 lg:grid-cols-3'>
        {months.map((month, monthIdx) => {
          const monthEvents = getEventsForMonth(monthIdx);
          const daysInMonth = getDaysInMonth(monthIdx);
          const firstDay = getFirstDayOfMonth(monthIdx);

          return (
            <div
              key={month}
              className='border-border hover:border-ring cursor-pointer rounded-lg border p-2.5 transition-colors md:p-3'
              onClick={() => onMonthClick(monthIdx)}
            >
              <div className='mb-2 flex items-center justify-between'>
                <div className='text-foreground text-sm font-semibold md:text-base'>{month}</div>
                {monthEvents.length > 0 && (
                  <div className='bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-semibold md:text-xs'>
                    {monthEvents.length}
                  </div>
                )}
              </div>
              <div className='grid grid-cols-7 gap-0.5'>
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNumber = i + 1;
                  const targetDate = new Date(currentDate.getFullYear(), monthIdx, dayNumber);
                  const hasEvent = monthEvents.some(
                    event => new Date(event.startTime).toDateString() === targetDate.toDateString()
                  );
                  return (
                    <div
                      key={dayNumber}
                      className={`rounded p-0.5 text-center text-[10px] md:text-xs ${
                        hasEvent
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-primary/5'
                      }`}
                    >
                      {dayNumber}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ScheduleStudentEnrollmentTable: React.FC<{ students: StudentEnrollment[] }> = ({
  students,
}) => {
  const getStatusBadge = (status: StudentEnrollment['attendanceStatus']) => {
    const config = {
      present: { bg: 'bg-success/15', text: 'text-success', icon: Check },
      absent: { bg: 'bg-destructive/15', text: 'text-destructive', icon: X },
      pending: { bg: 'bg-warning/15', text: 'text-warning', icon: Clock },
    };
    const { bg, text, icon: Icon } = config[status];
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${bg} ${text}`}
      >
        <Icon className='h-3 w-3' />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className='mt-4'>
      <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase'>
        Enrolled Students ({students.length})
      </h4>
      <div className='border-border overflow-hidden rounded-lg border'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-muted border-border border-b'>
              <tr>
                <th className='text-muted-foreground px-3 py-2 text-left text-xs font-semibold'>
                  Name
                </th>
                <th className='text-muted-foreground px-3 py-2 text-left text-xs font-semibold'>
                  Enrolled
                </th>
                <th className='text-muted-foreground px-3 py-2 text-left text-xs font-semibold'>
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody className='divide-border divide-y'>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={3} className='text-muted-foreground px-3 py-6 text-center text-sm'>
                    No students enrolled for this session
                  </td>
                </tr>
              ) : (
                students.map(student => (
                  <tr key={student.id} className='hover:bg-primary/5 transition-colors'>
                    <td className='text-foreground px-3 py-2 text-sm font-medium'>
                      {student.name}
                    </td>
                    <td className='text-muted-foreground px-3 py-2 text-sm'>
                      {student.enrollmentDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className='px-3 py-2'>{getStatusBadge(student.attendanceStatus)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const ScheduleSessionDetailsPanel: React.FC<{
  selectedEvent: CalendarEvent | null;
  isLoadingStudents: boolean;
  transformedStudents: StudentEnrollment[];
  onAcceptRequest?: () => void;
  onDeclineRequest?: () => void;
  isUpdatingRequest?: boolean;
}> = ({
  selectedEvent,
  isLoadingStudents,
  transformedStudents,
  onAcceptRequest,
  onDeclineRequest,
  isUpdatingRequest,
}) => {
  if (!selectedEvent) {
    return (
      <div className='flex h-full items-center justify-center p-6'>
        <div className='text-muted-foreground text-center'>
          <Calendar className='mx-auto mb-2 h-10 w-10 opacity-50' />
          <p className='text-sm'>Select a class session to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className='border-border bg-background border-b p-4'>
        <h3 className='text-muted-foreground mb-1.5 text-xs font-semibold tracking-wider uppercase'>
          {isBookingRequestEvent(selectedEvent) ? 'Booking Request' : 'Class Session'}
        </h3>
        <h2 className='text-foreground text-base font-bold'>{selectedEvent.title}</h2>
        {selectedEvent.courseName && (
          <p className='text-muted-foreground mt-0.5 text-sm'>{selectedEvent.courseName}</p>
        )}
      </div>
      <div className='space-y-4 p-4'>
        <div className='border-border border-b pb-3'>
          <div className='mb-1.5 flex items-center gap-1.5'>
            <Calendar className='text-muted-foreground h-3.5 w-3.5' />
            <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
              Date & Time
            </span>
          </div>
          <p className='text-foreground mt-0.5 text-sm'>
            {new Date(selectedEvent.startTime).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}{' '}
            •{' '}
            {new Date(selectedEvent.startTime).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            -{' '}
            {new Date(selectedEvent.endTime).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className='border-border border-b pb-3'>
          <div className='mb-1.5 flex items-center gap-1.5'>
            <Users className='text-muted-foreground h-3.5 w-3.5' />
            <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
              {isBookingRequestEvent(selectedEvent) ? 'Requester' : 'Instructor'}
            </span>
          </div>
          <p className='text-foreground mt-0.5 text-sm'>
            {selectedEvent.studentName || selectedEvent.instructor || 'Unassigned'}
          </p>
        </div>
        <div className='border-border border-b pb-3'>
          <div className='mb-1.5 flex items-center gap-1.5'>
            <MapPin className='text-muted-foreground h-3.5 w-3.5' />
            <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
              Location
            </span>
          </div>
          <p className='text-foreground mt-0.5 text-sm'>
            {selectedEvent.location} ({selectedEvent.locationType})
          </p>
        </div>
        {isBookingRequestEvent(selectedEvent) && (
          <div className='border-border border-b pb-3'>
            <div className='mb-1.5 flex items-center gap-1.5'>
              <Info className='text-muted-foreground h-3.5 w-3.5' />
              <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                Request details
              </span>
            </div>
            <p className='text-foreground text-sm'>
              {selectedEvent.requestSource || 'Request added to the schedule'}
            </p>
            {selectedEvent.requestNote && (
              <p className='text-muted-foreground mt-1 text-sm'>{selectedEvent.requestNote}</p>
            )}
            {selectedEvent.requestStatus && (
              <span className='border-warning/70 bg-warning/10 text-warning mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize'>
                {selectedEvent.requestStatus.replaceAll('_', ' ')}
              </span>
            )}
          </div>
        )}
        <div className='border-border border-b pb-3'>
          <div className='mb-1.5 flex items-center gap-1.5'>
            <Users className='text-muted-foreground h-3.5 w-3.5' />
            <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
              Capacity
            </span>
          </div>
          <p className='text-foreground mt-0.5 text-sm'>
            {selectedEvent.maxParticipants} participants
          </p>
        </div>
        <div className='border-border border-b pb-3'>
          <div className='mb-1.5 flex items-center gap-1.5'>
            <Home className='text-muted-foreground h-3.5 w-3.5' />
            <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
              Session Format
            </span>
          </div>
          <p className='text-foreground mt-0.5 text-sm'>{selectedEvent.sessionFormat}</p>
        </div>
        <div className='border-border border-t pt-3'>
          <div className='bg-primary/10 border-primary/20 rounded-lg border p-3'>
            <div className='text-primary mb-0.5 text-xs font-semibold tracking-wider uppercase'>
              {isBookingRequestEvent(selectedEvent) ? 'Requested Fee' : 'Training Fee (/hr/head)'}
            </div>
            <div className='text-primary text-xl font-bold'>${selectedEvent.trainingFee}</div>
          </div>
        </div>

        {isBookingRequestEvent(selectedEvent) ? (
          <div className='flex gap-3 pt-1'>
            <Button
              className='flex-1'
              onClick={onAcceptRequest}
              disabled={isUpdatingRequest}
            >
              Accept request
            </Button>
            <Button
              variant='outline'
              className='flex-1'
              onClick={onDeclineRequest}
              disabled={isUpdatingRequest}
            >
              Decline request
            </Button>
          </div>
        ) : isLoadingStudents ? (
          <div className='mt-4'>
            <Skeleton className='mb-2 h-4 w-32' />
            <div className='border-border overflow-hidden rounded-lg border'>
              <div className='bg-muted border-border flex gap-4 border-b p-3'>
                <Skeleton className='h-3 w-20' />
                <Skeleton className='h-3 w-24' />
                <Skeleton className='h-3 w-16' />
              </div>
              <div className='divide-border divide-y'>
                {[1, 2, 3].map(i => (
                  <div key={i} className='flex gap-4 p-3'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='h-6 w-16 rounded-full' />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ScheduleStudentEnrollmentTable students={transformedStudents} />
        )}
      </div>
    </div>
  );
};

export const ScheduleLoadingState: React.FC = () => (
  <div className='flex flex-1 overflow-hidden'>
    <div className='bg-background border-border flex w-60 flex-col border-r md:w-64'>
      <div className='border-border border-b p-3 md:p-4'>
        <Skeleton className='h-9 w-full rounded-lg' />
      </div>
      <div className='flex-1 space-y-3 p-4'>
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-32 w-full' />
      </div>
    </div>
    <div className='flex-1 space-y-2 p-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-12 w-full' />
    </div>
    <div className='bg-muted/30 border-border hidden space-y-4 border-l p-4 lg:block lg:w-80'>
      <Skeleton className='h-20 w-full' />
      <Skeleton className='h-16 w-full' />
      <Skeleton className='h-16 w-full' />
      <Skeleton className='h-16 w-full' />
      <Skeleton className='h-32 w-full' />
    </div>
  </div>
);
