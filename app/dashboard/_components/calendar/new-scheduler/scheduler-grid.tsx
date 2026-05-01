import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
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

function getDurationHours(event: SchedulerEvent) {
  return Math.max((event.endTime.getTime() - event.startTime.getTime()) / 36e5, 0.75);
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
        categoryStyles[event.category]
      )}
      style={{
        top: `${(getStartHour(event) % 1) * rowHeight + 6}px`,
        height: `${Math.max(getDurationHours(event) * rowHeight - 10, 50)}px`,
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
        categoryStyles[event.category]
      )}
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
        categoryStyles[event.category]
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
                        className='absolute right-2 left-2 top-2'
                        style={{
                          top: `${(event.startTime.getMinutes() / 60) * rowHeight + 6}px`,
                        }}
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

      <div className='bg-background max-h-[720px] overflow-x-auto overflow-y-auto'>
        <div className='min-w-max'>
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
                    <div className='space-y-1'>
                      {hourEvents.map(event => (
                        <WeekEventBlock key={event.id} event={event} onClick={onEventClick} />
                      ))}
                    </div>
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
                      isSameCalendarDay(day, today) && 'bg-primary text-primary-foreground',
                      dayEvents.length > 0 && !isSameCalendarDay(day, today) && 'bg-primary/10'
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
  onEmptySlotClick,
}: {
  currentDate: Date;
  events: SchedulerEvent[];
  onEmptySlotClick?: (slot: EmptySlot) => void;
}) {
  const today = new Date();
  const months = Array.from(
    { length: 12 },
    (_, index) => new Date(currentDate.getFullYear(), index, 1)
  );

  return (
    <section className='bg-card grid min-w-0 w-full gap-3 overflow-hidden rounded-md border p-3 shadow-sm sm:grid-cols-2 xl:grid-cols-3'>
      {months.map(month => {
        const monthEvents = getMonthEvents(events, month);
        const monthDays = getMonthDays(month);
        const monthEventDays = new Set(monthEvents.map(event => getCalendarKey(event.startTime)));

        return (
          <div
            key={month.toISOString()}
            className='bg-background rounded-md border p-3'
            role='button'
            tabIndex={0}
            onClick={() =>
              onEmptySlotClick?.({
                date: month,
                startTime: new Date(month.getFullYear(), month.getMonth(), 1, 9, 0, 0, 0),
                endTime: new Date(month.getFullYear(), month.getMonth(), 1, 10, 0, 0, 0),
                view: 'year',
              })
            }
          >
            <div className='mb-3 flex items-center justify-between gap-2'>
              <h3 className='text-foreground text-sm font-semibold'>
                {month.toLocaleDateString('en-US', { month: 'long' })}
              </h3>
              <span className='text-muted-foreground text-xs'>{monthEvents.length} sessions</span>
            </div>

            <div className='mb-2 grid grid-cols-7 text-[10px] font-semibold text-muted-foreground'>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(label => (
                <span key={`${month.toISOString()}-${label}`} className='text-center'>
                  {label}
                </span>
              ))}
            </div>

            <div className='grid grid-cols-7 gap-1'>
              {monthDays.map(day => {
                const dayKey = getCalendarKey(day);
                const hasEvents = monthEventDays.has(dayKey);
                const inMonth = isSameMonth(day, month);

                return (
              <div
                    key={day.toISOString()}
                    className={cn(
                      'relative flex aspect-square items-center justify-center rounded text-[11px] font-semibold',
                      inMonth ? 'text-foreground' : 'text-muted-foreground/50',
                      isSameCalendarDay(day, today) && 'bg-primary text-primary-foreground',
                      hasEvents &&
                      !isSameCalendarDay(day, today) &&
                      'bg-primary/10 ring-1 ring-primary/30'
                    )}
                  >
                    <span>{day.getDate()}</span>
                    {hasEvents ? (
                      <span
                        className={cn(
                          'absolute bottom-1 h-1.5 w-1.5 rounded-full',
                          isSameCalendarDay(day, today) ? 'bg-primary-foreground' : 'bg-primary'
                        )}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
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
