import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../../components/ui/dialog';
import { categoryStyles, schedulerHours } from './data';
import type { SchedulerEvent, SchedulerView } from './types';

const rowHeight = 58;
const weekColumnClass =
  'grid-cols-[72px_repeat(7,110px)] sm:grid-cols-[78px_repeat(7,110px)] lg:grid-cols-[88px_repeat(7,110px)]';

type EmptySlot = {
  date: Date;
  startTime: Date;
  endTime: Date;
  view: SchedulerView;
};

function formatHour(hour: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalized = hour % 12 || 12;
  return `${normalized}:00 ${suffix}`;
}

function getWeekStart(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - day + (day === 0 ? -6 : 1));
  return next;
}

function getWeekDays(currentDate: Date) {
  const weekStart = getWeekStart(currentDate);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
}

function isSameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function getCalendarKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthDays(currentDate: Date) {
  const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const gridStart = getWeekStart(firstOfMonth);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function getMonthEvents(events: SchedulerEvent[], monthDate: Date) {
  return events
    .filter(event => isSameMonth(event.startTime, monthDate))
    .sort((left, right) => left.startTime.getTime() - right.startTime.getTime());
}

function getDayEvents(events: SchedulerEvent[], day: Date) {
  return events
    .filter(event => isSameCalendarDay(event.startTime, day))
    .sort((left, right) => left.startTime.getTime() - right.startTime.getTime());
}

function getStartHour(event: SchedulerEvent) {
  return event.startTime.getHours() + event.startTime.getMinutes() / 60;
}

function getOccupancyHours(event: SchedulerEvent) {
  const startHour = event.startTime.getHours() + event.startTime.getMinutes() / 60;
  const endHour = event.endTime.getHours() + event.endTime.getMinutes() / 60;
  return Math.max(Math.floor(endHour) - Math.floor(startHour) + 1, 1);
}

function isCancelledStatus(status?: string) {
  return Boolean(status?.toLowerCase().includes('cancel'));
}

function getEventStyles(event: SchedulerEvent) {
  if (isCancelledStatus(event.status)) {
    return 'border-destructive/70 bg-destructive text-destructive-foreground';
  }

  return categoryStyles[event.category];
}

function getCurrentTimeOffset(currentTime: Date) {
  return (currentTime.getMinutes() / 60) * rowHeight;
}

function CurrentTimeIndicator({ currentTime }: { currentTime: Date }) {
  return (
    <div
      className='pointer-events-none absolute right-0 left-0 z-30 flex items-center'
      style={{ top: `${getCurrentTimeOffset(currentTime)}px` }}
      aria-hidden='true'
    >
      <span className='bg-destructive h-2 w-2 shrink-0 rounded-full' />
      <span className='bg-destructive h-0.5 flex-1 shadow-sm' />
    </div>
  );
}

function EventBlock({
  event,
  onClick,
}: {
  event: SchedulerEvent;
  onClick?: (event: SchedulerEvent) => void;
}) {
  return (
    <button
      type='button'
      className={cn(
        'focus-visible:ring-ring absolute inset-x-0.5 overflow-hidden rounded-md border px-1 py-1 text-left shadow-sm transition hover:shadow-md focus-visible:ring-2 focus-visible:outline-none sm:inset-x-1 sm:px-1.5 lg:inset-x-2 lg:p-2',
        getEventStyles(event)
      )}
      style={{
        top: `${(getStartHour(event) % 1) * rowHeight + 6}px`,
        height: `${Math.max(getOccupancyHours(event) * rowHeight - 10, 50)}px`,
      }}
      onClick={eventData => {
        eventData.stopPropagation();
        onClick?.(event);
      }}
    >
      <p className='truncate text-[9px] font-semibold sm:text-[10px] lg:text-xs'>{event.title}</p>
      <p className='hidden truncate text-[9px] opacity-80 sm:block lg:text-[11px]'>
        {event.instructor}
      </p>
      <p className='hidden truncate text-[9px] opacity-75 md:block lg:text-[11px]'>
        {event.location}
      </p>
      <div className='mt-1 hidden items-center gap-1 lg:flex'>
        {event.students.slice(0, 3).map(student => (
          <Avatar key={student} className='h-5 w-5 border'>
            <AvatarFallback className='text-[8px]'>{student}</AvatarFallback>
          </Avatar>
        ))}
        <span className='text-[10px] opacity-75'>+{event.students.length + 7}</span>
      </div>
    </button>
  );
}

function WeekEventBlock({
  event,
  onClick,
}: {
  event: SchedulerEvent;
  onClick?: (event: SchedulerEvent) => void;
}) {
  return (
    <button
      type='button'
      className={cn(
        'focus-visible:ring-ring w-full overflow-hidden rounded-md border px-2 py-1 text-left shadow-sm transition hover:shadow-md focus-visible:ring-2 focus-visible:outline-none',
        getEventStyles(event)
      )}
      style={{
        height: `${Math.max(getOccupancyHours(event) * rowHeight - 10, 50)}px`,
      }}
      onClick={eventData => {
        eventData.stopPropagation();
        onClick?.(event);
      }}
    >
      <p className='truncate text-[10px] font-semibold sm:text-[11px]'>{event.title}</p>
      <p className='truncate text-[9px] opacity-75'>
        {event.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} -
        {event.endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </p>
      <p className='hidden truncate text-[9px] opacity-75 sm:block'>{event.location}</p>
    </button>
  );
}

function CompactEvent({
  event,
  onClick,
}: {
  event: SchedulerEvent;
  onClick?: (event: SchedulerEvent) => void;
}) {
  return (
    <div
      role='button'
      tabIndex={0}
      onClick={eventData => {
        eventData.stopPropagation();
        onClick?.(event);
      }}
      className={cn(
        'min-w-0 rounded border px-2 py-1 text-left text-[10px] font-semibold transition hover:shadow-sm',
        getEventStyles(event)
      )}
    >
      <p className='truncate'>{event.title}</p>
      <p className='truncate opacity-75'>
        {event.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </p>
    </div>
  );
}

function DayGrid({
  currentDate,
  currentTime,
  events,
  onEventClick,
  onEmptySlotClick,
}: {
  currentDate: Date;
  currentTime: Date;
  events: SchedulerEvent[];
  onEventClick?: (event: SchedulerEvent) => void;
  onEmptySlotClick?: (slot: EmptySlot) => void;
}) {
  const today = new Date();
  const dayEvents = getDayEvents(events, currentDate);
  const shouldShowCurrentTime = isSameCalendarDay(currentDate, currentTime);
  const currentDayLabel = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <section className='bg-card flex w-full flex-col overflow-hidden rounded-md border shadow-sm'>
      <div className='border-b px-3 py-3 sm:px-4'>
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <div className='min-w-0'>
            <p className='text-muted-foreground text-xs font-semibold uppercase tracking-wide'>
              Day view
            </p>
            <h2 className='text-foreground text-base font-semibold sm:text-lg'>{currentDayLabel}</h2>
            <p className='text-muted-foreground text-sm'>
              {dayEvents.length} session{dayEvents.length === 1 ? '' : 's'} scheduled
            </p>
          </div>
          <span
            className={cn(
              'rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide',
              isSameCalendarDay(currentDate, today)
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isSameCalendarDay(currentDate, today) ? 'Today' : 'Selected day'}
          </span>
        </div>
      </div>

      <div className='grid gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_260px] lg:p-4'>
        <div className='bg-background min-w-0 overflow-hidden rounded-md border'>
          <div className='bg-muted/40 grid grid-cols-[72px_1fr] border-b'>
            <div className='px-2 py-2 text-center text-[10px] font-semibold sm:text-xs'>Time</div>
            <div className='px-2 py-2 text-center text-[10px] font-semibold sm:text-xs'>
              Schedule
            </div>
          </div>

          <div className='max-h-[640px] overflow-y-auto'>
            {schedulerHours.map(hour => (
              <div
                key={hour}
                role='button'
                tabIndex={0}
                className='grid grid-cols-[72px_1fr] border-b last:border-b-0'
                onClick={() =>
                  onEmptySlotClick?.({
                    date: currentDate,
                    startTime: new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      currentDate.getDate(),
                      hour,
                      0,
                      0,
                      0
                    ),
                    endTime: new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      currentDate.getDate(),
                      hour + 1,
                      0,
                      0,
                      0
                    ),
                    view: 'day',
                  })
                }
              >
                <div className='text-muted-foreground px-2 py-2 text-right text-[9px] font-semibold sm:text-[10px]'>
                  {formatHour(hour)}
                </div>
                <div className='relative min-h-[58px] border-l'>
                  {shouldShowCurrentTime && currentTime.getHours() === hour ? (
                    <CurrentTimeIndicator currentTime={currentTime} />
                  ) : null}
                  {dayEvents
                    .filter(event => event.startTime.getHours() === hour)
                    .map(event => (
                      <div
                        key={event.id}
                        className='absolute right-2 left-2 top-2 z-10'
                      >
                        <EventBlock event={event} onClick={onEventClick} />
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='space-y-3'>
          <div className='bg-background rounded-md border p-3'>
            <div className='mb-2 flex items-center justify-between gap-2'>
              <h3 className='text-sm font-semibold'>Events</h3>
              <span className='text-muted-foreground text-xs'>{dayEvents.length} items</span>
            </div>

            <div className='space-y-2'>
              {dayEvents.length ? (
                dayEvents.map(event => (
                  <div key={event.id} className='bg-muted/30 rounded-md border p-2'>
                    <p className='text-foreground text-sm font-semibold'>{event.title}</p>
                    <p className='text-muted-foreground text-xs'>
                      {event.startTime.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {event.endTime.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className='text-muted-foreground mt-1 truncate text-xs'>
                      {event.instructor} · {event.location}
                    </p>
                  </div>
                ))
              ) : (
                <p className='text-muted-foreground bg-muted/30 rounded-md border border-dashed p-3 text-xs'>
                  No sessions scheduled for this day.
                </p>
              )}
            </div>
          </div>

          <div className='bg-background rounded-md border p-3'>
            <h3 className='mb-2 text-sm font-semibold'>Summary</h3>
            <p className='text-muted-foreground text-xs'>
              {currentDayLabel} is currently showing {dayEvents.length} scheduled session
              {dayEvents.length === 1 ? '' : 's'}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function WeekGrid({
  currentDate,
  currentTime,
  events,
  onEventClick,
  onEmptySlotClick,
}: {
  currentDate: Date;
  currentTime: Date;
  events: SchedulerEvent[];
  onEventClick?: (event: SchedulerEvent) => void;
  onEmptySlotClick?: (slot: EmptySlot) => void;
}) {
  const schedulerDays = getWeekDays(currentDate);
  const today = new Date();
  const gridClass = weekColumnClass;

  return (
    <section className='bg-card flex min-w-0 w-full flex-col overflow-hidden rounded-md ring-1 ring-border/60 shadow-sm'>
      <div className='bg-background max-h-[720px] overflow-x-auto overflow-y-auto'>
        <div className='min-w-max'>
          <div className='sticky top-0 z-10 bg-muted/40'>
            <div className={cn('grid border-b', gridClass)}>
              <div className='text-foreground px-2 py-2 text-center text-[10px] font-semibold sm:px-3 sm:text-xs'>
                Time
              </div>
              {schedulerDays.map(day => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'border-l px-1 py-2 text-center text-[10px] font-semibold sm:px-2 sm:text-xs lg:text-sm',
                    isSameCalendarDay(day, today) && 'bg-primary text-primary-foreground'
                  )}
                >
                  <span className='block sm:inline'>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className='sm:ml-1'>{day.getDate()}</span>
                </div>
              ))}
            </div>
          </div>

          {schedulerHours.map(hour => (
            <div
              key={hour}
              className={cn('grid border-b last:border-b-0', gridClass)}
              style={{ minHeight: `${rowHeight}px` }}
            >
              <div className='text-muted-foreground px-2 py-2 text-right text-[9px] font-semibold sm:px-3 sm:text-[10px] lg:text-xs'>
                {formatHour(hour)}
              </div>

              {schedulerDays.map(day => {
                const hourEvents = events
                  .filter(
                    event =>
                      isSameCalendarDay(event.startTime, day) &&
                      event.startTime.getHours() === hour
                  )
                  .sort((left, right) => left.startTime.getTime() - right.startTime.getTime());

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    role='button'
                    tabIndex={0}
                    className='relative border-l px-1 py-1'
                    onClick={() =>
                      onEmptySlotClick?.({
                        date: day,
                        startTime: new Date(
                          day.getFullYear(),
                          day.getMonth(),
                          day.getDate(),
                          hour,
                          0,
                          0,
                          0
                        ),
                        endTime: new Date(
                          day.getFullYear(),
                          day.getMonth(),
                          day.getDate(),
                          hour + 1,
                          0,
                          0,
                          0
                        ),
                        view: 'week',
                      })
                    }
                  >
                    {isSameCalendarDay(day, currentTime) && currentTime.getHours() === hour ? (
                      <CurrentTimeIndicator currentTime={currentTime} />
                    ) : null}
                    {hourEvents.map(event => (
                      <div
                        key={event.id}
                        className='absolute right-1 left-1 top-1 z-10'
                        style={{
                          top: `${(event.startTime.getMinutes() / 60) * rowHeight + 6}px`,
                        }}
                      >
                        <WeekEventBlock event={event} onClick={onEventClick} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MonthGrid({
  currentDate,
  events,
  onEventClick,
  onEmptySlotClick,
}: {
  currentDate: Date;
  events: SchedulerEvent[];
  onEventClick?: (event: SchedulerEvent) => void;
  onEmptySlotClick?: (slot: EmptySlot) => void;
}) {
  const days = getMonthDays(currentDate);
  const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const monthEvents = getMonthEvents(events, currentDate);

  return (
    <section className='bg-card min-w-0 w-full overflow-hidden rounded-md border shadow-sm'>
      <div className='border-b px-3 py-3 sm:px-4'>
        <div className='flex items-center justify-between gap-2'>
          <div>
            <p className='text-muted-foreground text-xs font-semibold uppercase tracking-wide'>
              Month view
            </p>
            <h2 className='text-foreground text-base font-semibold sm:text-lg'>
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          <span className='text-muted-foreground text-xs'>
            {monthEvents.length} session{monthEvents.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className='overflow-x-auto'>
        <div
          className='bg-muted/40 grid w-max min-w-full border-b'
          style={{ gridTemplateColumns: 'repeat(7, 120px)' }}
        >
          {weekLabels.map(label => (
            <div key={label} className='px-2 py-2 text-center text-xs font-semibold'>
              {label}
            </div>
          ))}
        </div>

        <div className='grid w-max min-w-full' style={{ gridTemplateColumns: 'repeat(7, 120px)' }}>
          {days.map(day => {
            const dayEvents = getDayEvents(events, day);
            const hasCancelledEvents = dayEvents.some(event => isCancelledStatus(event.status));

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-28 border-r border-b p-2 last:border-r-0 sm:min-h-32',
                  !isSameMonth(day, currentDate) && 'bg-muted/20 text-muted-foreground'
                )}
                role='button'
                tabIndex={0}
                onClick={() =>
                  onEmptySlotClick?.({
                    date: day,
                    startTime: new Date(
                      day.getFullYear(),
                      day.getMonth(),
                      day.getDate(),
                      9,
                      0,
                      0,
                      0
                    ),
                    endTime: new Date(
                      day.getFullYear(),
                      day.getMonth(),
                      day.getDate(),
                      10,
                      0,
                      0,
                      0
                    ),
                    view: 'month',
                  })
                }
              >
                <div className='mb-2 flex items-center justify-between gap-2'>
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded text-xs font-semibold',
                      isSameCalendarDay(day, today) &&
                      (hasCancelledEvents
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-primary text-primary-foreground'),
                      dayEvents.length > 0 &&
                      !isSameCalendarDay(day, today) &&
                      (hasCancelledEvents ? 'bg-destructive/10' : 'bg-primary/10')
                    )}
                  >
                    {day.getDate()}
                  </span>
                  {dayEvents.length ? (
                    <span className='text-muted-foreground text-[10px]'>{dayEvents.length}</span>
                  ) : null}
                </div>
                <div className='space-y-1'>
                  {dayEvents.slice(0, 3).map(event => (
                    <CompactEvent key={event.id} event={event} onClick={onEventClick} />
                  ))}
                  {dayEvents.length > 3 ? (
                    <p className='text-muted-foreground text-[10px] font-semibold'>
                      +{dayEvents.length - 3} more
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function YearGrid({
  currentDate,
  events,
  onEventClick,
  onEmptySlotClick,
}: {
  currentDate: Date;
  events: SchedulerEvent[];
  onEventClick?: (event: SchedulerEvent) => void;
  onEmptySlotClick?: (slot: EmptySlot) => void;
}) {
  const today = new Date();

  const months = Array.from(
    { length: 12 },
    (_, index) => new Date(currentDate.getFullYear(), index, 1)
  );

  const [selectedEvents, setSelectedEvents] = useState<SchedulerEvent[] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <>
      <section className='bg-card grid min-w-0 w-full gap-3 overflow-hidden rounded-md border p-3 shadow-sm sm:grid-cols-2 xl:grid-cols-3'>
        {months.map(month => {
          const monthEvents = getMonthEvents(events, month);

          const monthDays = getMonthDays(month);

          const monthCancelledEventDays = new Set(
            monthEvents
              .filter(event => isCancelledStatus(event.status))
              .map(event => getCalendarKey(event.startTime))
          );

          return (
            <div
              key={month.toISOString()}
              className='bg-background rounded-md border p-3'
            >
              <div className='mb-3 flex items-center justify-between gap-2'>
                <h3 className='text-foreground text-sm font-semibold'>
                  {month.toLocaleDateString('en-US', { month: 'long' })}
                </h3>

                <span className='text-muted-foreground text-xs'>
                  {monthEvents.length} sessions
                </span>
              </div>

              <div className='mb-2 grid grid-cols-7 text-[10px] font-semibold text-muted-foreground'>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(label => (
                  <span
                    key={`${month.toISOString()}-${label}`}
                    className='text-center'
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className='grid grid-cols-7 gap-1'>
                {monthDays.map(day => {
                  const dayKey = getCalendarKey(day);

                  const dayEvents = getDayEvents(events, day);

                  const hasEvents = dayEvents.length > 0;

                  const hasCancelledEvents = monthCancelledEventDays.has(dayKey);

                  const inMonth = isSameMonth(day, month);

                  return (
                    <button
                      key={day.toISOString()}
                      type='button'
                      className={cn(
                        'relative flex aspect-square cursor-pointer items-center justify-center rounded text-[11px] font-semibold transition-colors hover:bg-muted',
                        inMonth
                          ? 'text-foreground'
                          : 'text-muted-foreground/50',
                        isSameCalendarDay(day, today) &&
                        (hasCancelledEvents
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-primary text-primary-foreground'),
                        hasEvents &&
                        !isSameCalendarDay(day, today) &&
                        (hasCancelledEvents
                          ? 'bg-destructive/10 ring-1 ring-destructive/30'
                          : 'bg-primary/10 ring-1 ring-primary/30')
                      )}
                      onClick={e => {
                        e.stopPropagation();

                        // Single event → open immediately
                        if (dayEvents.length === 1) {
                          onEventClick?.(dayEvents[0]);
                          return;
                        }

                        // Multiple events → show picker dialog
                        if (dayEvents.length > 1) {
                          setSelectedEvents(dayEvents);
                          setSelectedDate(day);
                          return;
                        }

                        // Empty day → create slot
                        onEmptySlotClick?.({
                          date: day,
                          startTime: new Date(
                            day.getFullYear(),
                            day.getMonth(),
                            day.getDate(),
                            9,
                            0,
                            0,
                            0
                          ),
                          endTime: new Date(
                            day.getFullYear(),
                            day.getMonth(),
                            day.getDate(),
                            10,
                            0,
                            0,
                            0
                          ),
                          view: 'year',
                        });
                      }}
                    >
                      <span>{day.getDate()}</span>

                      {hasEvents ? (
                        <span
                          className={cn(
                            'absolute bottom-1 h-1.5 w-1.5 rounded-full',
                            hasCancelledEvents
                              ? 'bg-destructive'
                              : isSameCalendarDay(day, today)
                                ? 'bg-primary-foreground'
                                : 'bg-primary'
                          )}
                        />
                      ) : null}

                      {dayEvents.length > 1 ? (
                        <span className='bg-background absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border px-1 text-[8px] font-bold leading-none'>
                          {dayEvents.length}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Events Picker Dialog */}
      <Dialog
        open={!!selectedEvents}
        onOpenChange={open => {
          if (!open) {
            setSelectedEvents(null);
            setSelectedDate(null);
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {selectedDate?.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-2'>
            {[...(selectedEvents ?? [])]
              .sort(
                (a, b) =>
                  new Date(a.startTime).getTime() -
                  new Date(b.startTime).getTime()
              )
              .map(event => (
                <button
                  key={event.id}
                  type='button'
                  className='hover:bg-muted w-full rounded-md border p-3 text-left transition-colors'
                  onClick={() => {
                    onEventClick?.(event);

                    setSelectedEvents(null);
                    setSelectedDate(null);
                  }}
                >
                  <div className='flex flex-col gap-3'>
                    {/* Header */}
                    <div className='flex items-start justify-between gap-2'>
                      <div className='min-w-0 flex-1'>
                        <p className='break-words font-medium leading-snug whitespace-normal'>
                          {event.course}
                        </p>

                        <p className='text-muted-foreground mt-1 text-sm'>
                          {new Date(event.startTime).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                          {' - '}
                          {new Date(event.endTime).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>

                      {isCancelledStatus(event.status) ? (
                        <span className='bg-destructive/10 text-destructive shrink-0 rounded px-2 py-1 text-[10px] font-semibold'>
                          Cancelled
                        </span>
                      ) : (
                        <span className='bg-primary/10 text-primary shrink-0 rounded px-2 py-1 text-[10px] font-semibold'>
                          {event.status}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-xs'>
                      <div className='flex items-center gap-1'>
                        <span className='font-medium text-foreground'>
                          Type:
                        </span>
                        <span>{event.locationType}</span>
                      </div>

                      <div className='flex items-center gap-1'>
                        <span className='font-medium text-foreground'>
                          Location:
                        </span>
                        <span className='break-words'>
                          {event.location}
                        </span>
                      </div>

                      {event.meetingLink ? (
                        <div className='min-w-0'>
                          <a
                            href={event.meetingLink}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-primary hover:underline break-all'
                            onClick={e => e.stopPropagation()}
                          >
                            Join Meeting
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SchedulerGrid({
  currentDate,
  events,
  view,
  onEventClick,
  onEmptySlotClick,
}: {
  currentDate: Date;
  events: SchedulerEvent[];
  view: SchedulerView;
  onEventClick?: (event: SchedulerEvent) => void;
  onEmptySlotClick?: (slot: EmptySlot) => void;
}) {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 30 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (view === 'day') {
    return (
      <DayGrid
        currentDate={currentDate}
        currentTime={currentTime}
        events={events}
        onEventClick={onEventClick}
        onEmptySlotClick={onEmptySlotClick}
      />
    );
  }

  if (view === 'month') {
    return (
      <MonthGrid
        currentDate={currentDate}
        events={events}
        onEventClick={onEventClick}
        onEmptySlotClick={onEmptySlotClick}
      />
    );
  }

  if (view === 'year') {
    return (
      <YearGrid
        currentDate={currentDate}
        events={events}
        onEmptySlotClick={onEmptySlotClick}
        onEventClick={onEventClick}
      />
    );
  }

  return (
    <WeekGrid
      currentDate={currentDate}
      currentTime={currentTime}
      events={events}
      onEventClick={onEventClick}
      onEmptySlotClick={onEmptySlotClick}
    />
  );
}
