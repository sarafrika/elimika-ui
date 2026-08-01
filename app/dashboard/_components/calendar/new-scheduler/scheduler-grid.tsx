import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { CreateClassDialog } from '../create-class-dialog';
import { categoryStyles, schedulerHours } from './data';
import type { SchedulerEvent, SchedulerView } from './types';

const rowHeight = 58;

// Time gutter + 7 day columns. The day columns share `minmax(0,1fr)` so they
// always divide the remaining width equally, regardless of viewport size.
const weekColumnClass =
  'grid-cols-[64px_repeat(7,minmax(0,1fr))] sm:grid-cols-[72px_repeat(7,minmax(0,1fr))] lg:grid-cols-[84px_repeat(7,minmax(0,1fr))]';

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

function getEventTop(event: SchedulerEvent) {
  const hours = event.startTime.getHours();
  const minutes = event.startTime.getMinutes();

  return hours * rowHeight + (minutes / 60) * rowHeight;
}

function getEventHeight(event: SchedulerEvent) {
  const durationMs = new Date(event.endTime).getTime() - new Date(event.startTime).getTime();

  const durationMinutes = durationMs / (1000 * 60);

  return Math.max((durationMinutes / 60) * rowHeight, 40);
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
      style={{
        top: `${getCurrentTimeOffset(currentTime)}px`,
      }}
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
        'focus-visible:ring-ring absolute inset-x-0 cursor-pointer overflow-hidden rounded-md border border-l-4 px-1 py-1 text-left shadow-sm transition hover:shadow-md focus-visible:ring-2 focus-visible:outline-none sm:px-1.5 lg:p-2',
        getEventStyles(event)
      )}
      style={{
        top: 0,
        height: `${getEventHeight(event)}px`,
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
        'focus-visible:ring-ring w-full cursor-pointer overflow-hidden rounded-md border border-l-4 px-2 py-1 text-left shadow-sm transition hover:shadow-md focus-visible:ring-2 focus-visible:outline-none',
        getEventStyles(event)
      )}
      style={{
        height: `${getEventHeight(event)}px`,
      }}
      onClick={eventData => {
        eventData.stopPropagation();
        onClick?.(event);
      }}
    >
      <p className='truncate text-[10px] font-semibold sm:text-[11px]'>{event.title}</p>

      <p className='truncate text-[9px] opacity-75'>
        {event.startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })}
        {' - '}
        {event.endTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })}
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
        'min-w-0 rounded border border-l-[3px] px-2 py-1 text-left text-[10px] font-semibold transition hover:shadow-sm',
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
  canCreateClass = false,
  onClassCreated,
}: {
  currentDate: Date;
  currentTime: Date;
  events: SchedulerEvent[];
  onEventClick?: (event: SchedulerEvent) => void;
  onEmptySlotClick?: (slot: EmptySlot) => void;
  canCreateClass?: boolean;
  onClassCreated?: () => void;
}) {
  const dayEvents = getDayEvents(events, currentDate);

  const shouldShowCurrentTime = isSameCalendarDay(currentDate, currentTime);

  // Empty-slot click -> class creation modal. Only wired up for roles that
  // are allowed to create classes (instructors / organisation profiles);
  // the caller controls this via `canCreateClass`.
  const [createSlot, setCreateSlot] = useState<EmptySlot | null>(null);

  function handleSlotClick(slot: EmptySlot) {
    // When this profile can create classes, the grid owns the flow via the
    // modal below. Don't also call onEmptySlotClick here — if the parent's
    // handler navigates away (e.g. router.push to a "new class" page), it
    // unmounts this component before the dialog ever gets a chance to open.
    if (canCreateClass) {
      setCreateSlot(slot);
      return;
    }
    onEmptySlotClick?.(slot);
  }

  return (
    <>
      <section className='bg-card flex w-full flex-col overflow-hidden rounded-md border shadow-sm'>
        <div className='grid gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_260px] lg:p-4'>
          {/* LEFT SCHEDULE */}
          <div className='bg-background min-w-0 overflow-hidden rounded-md border'>
            <div className='bg-muted/40 grid grid-cols-[72px_1fr] border-b'>
              <div className='px-2 py-2 text-center text-[10px] font-semibold sm:text-xs'>Time</div>

              <div className='px-2 py-2 text-center text-[10px] font-semibold sm:text-xs'>
                Schedule
              </div>
            </div>

            <div className='[&::-webkit-scrollbar-thumb]:bg-border max-h-[640px] overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-px [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent'>
              <div
                className='relative'
                style={{
                  height: `${schedulerHours.length * rowHeight}px`,
                }}
              >
                {/* GRID */}
                {schedulerHours.map(hour => (
                  <div
                    key={hour}
                    className='grid grid-cols-[72px_1fr] border-b'
                    style={{
                      height: `${rowHeight}px`,
                    }}
                  >
                    <div className='text-muted-foreground px-2 py-2 text-right text-[9px] font-semibold sm:text-[10px]'>
                      {formatHour(hour)}
                    </div>

                    <div
                      className={cn(
                        'relative border-l select-none',
                        canCreateClass || onEmptySlotClick ? 'cursor-pointer' : 'cursor-default'
                      )}
                      onClick={() =>
                        handleSlotClick({
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
                      {shouldShowCurrentTime && currentTime.getHours() === hour ? (
                        <CurrentTimeIndicator currentTime={currentTime} />
                      ) : null}
                    </div>
                  </div>
                ))}

                {/* EVENTS — pointer-events-none on the wrapper lets clicks on
                    empty space pass through to the hour slots underneath;
                    each event re-enables pointer events for itself. */}
                <div className='pointer-events-none absolute inset-0 left-[72px]'>
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className='pointer-events-auto absolute right-2 left-2'
                      style={{
                        top: `${getEventTop(event)}px`,
                      }}
                    >
                      <EventBlock event={event} onClick={onEventClick} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT DETAILS PANEL */}
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
                        })}
                        {' - '}
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
                {dayEvents.length} scheduled session
                {dayEvents.length === 1 ? '' : 's'} for this day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {canCreateClass && (
        <CreateClassDialog
          open={!!createSlot}
          onOpenChange={open => {
            if (!open) setCreateSlot(null);
          }}
          prefill={
            createSlot
              ? {
                  date: createSlot.date,
                  startTime: createSlot.startTime,
                  endTime: createSlot.endTime,
                }
              : null
          }
          onCreated={() => {
            setCreateSlot(null);
            onClassCreated?.();
          }}
        />
      )}
    </>
  );
}

function WeekGrid({
  currentDate,
  currentTime,
  events,
  onEventClick,
  onEmptySlotClick,
  canCreateClass = false,
  onClassCreated,
}: {
  currentDate: Date;
  currentTime: Date;
  events: SchedulerEvent[];
  onEventClick?: (event: SchedulerEvent) => void;
  onEmptySlotClick?: (slot: EmptySlot) => void;
  canCreateClass?: boolean;
  onClassCreated?: () => void;
}) {
  const schedulerDays = getWeekDays(currentDate);

  // Same click-to-create wiring as DayGrid — gated to instructor / organisation profiles.
  const [createSlot, setCreateSlot] = useState<EmptySlot | null>(null);

  function handleSlotClick(slot: EmptySlot) {
    // See DayGrid's handleSlotClick for why onEmptySlotClick is skipped here
    // when canCreateClass is true.
    if (canCreateClass) {
      setCreateSlot(slot);
      return;
    }
    onEmptySlotClick?.(slot);
  }

  return (
    <>
      <section className='bg-card ring-border/60 flex w-full min-w-0 flex-col overflow-hidden rounded-md shadow-sm ring-1'>
        <div className='bg-background [&::-webkit-scrollbar-thumb]:bg-border max-h-[720px] overflow-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-px [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent'>
          <div className='relative w-full min-w-0'>
            {/* HEADER */}
            <div className='bg-muted/40 sticky top-0 z-20'>
              <div className={cn('grid border-b', weekColumnClass)}>
                <div className='px-2 py-2 text-center text-xs font-semibold'>Time</div>

                {schedulerDays.map(day => (
                  <div
                    key={day.toISOString()}
                    className='border-l px-2 py-2 text-center text-xs font-semibold'
                  >
                    {day.toLocaleDateString('en-US', {
                      weekday: 'short',
                    })}{' '}
                    {day.getDate()}
                  </div>
                ))}
              </div>
            </div>

            {/* GRID */}
            <div
              className='relative'
              style={{
                height: `${schedulerHours.length * rowHeight}px`,
              }}
            >
              {schedulerHours.map(hour => (
                <div
                  key={hour}
                  className={cn('grid border-b last:border-b-0', weekColumnClass)}
                  style={{
                    height: `${rowHeight}px`,
                  }}
                >
                  <div className='text-muted-foreground px-2 py-2 text-right text-[9px] font-semibold'>
                    {formatHour(hour)}
                  </div>

                  {schedulerDays.map(day => (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={cn(
                        'relative border-l select-none',
                        canCreateClass || onEmptySlotClick ? 'cursor-pointer' : 'cursor-default'
                      )}
                      onClick={() =>
                        handleSlotClick({
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
                    </div>
                  ))}
                </div>
              ))}

              {/* EVENTS OVERLAY — pointer-events-none on the wrapper and each
                  day column lets clicks on empty space pass through to the
                  hour-slot handlers underneath; each event block re-enables
                  pointer events for itself. */}
              <div className={cn('pointer-events-none absolute inset-0 grid', weekColumnClass)}>
                <div />

                {schedulerDays.map(day => {
                  const dayEvents = events.filter(event => isSameCalendarDay(event.startTime, day));

                  return (
                    <div key={day.toISOString()} className='pointer-events-none relative'>
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          className='pointer-events-auto absolute right-1 left-1'
                          style={{
                            top: `${getEventTop(event)}px`,
                          }}
                        >
                          <WeekEventBlock event={event} onClick={onEventClick} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {canCreateClass && (
        <CreateClassDialog
          open={!!createSlot}
          onOpenChange={open => {
            if (!open) setCreateSlot(null);
          }}
          prefill={
            createSlot
              ? {
                  date: createSlot.date,
                  startTime: createSlot.startTime,
                  endTime: createSlot.endTime,
                }
              : null
          }
          onCreated={() => {
            setCreateSlot(null);
            onClassCreated?.();
          }}
        />
      )}
    </>
  );
}

function MonthGrid({
  currentDate,
  events,
  onEventClick,
  onEmptySlotClick,
  onSelectDate,
}: {
  currentDate: Date;
  events: SchedulerEvent[];
  onEventClick?: (event: SchedulerEvent) => void;
  onEmptySlotClick?: (slot: EmptySlot) => void;
  onSelectDate?: (date: Date) => void;
}) {
  const days = getMonthDays(currentDate);
  const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const monthEvents = getMonthEvents(events, currentDate);

  // Clicking a day cell navigates to that day's Day view. If the parent hasn't
  // wired `onSelectDate` yet, fall back to the old empty-slot-click behavior.
  function handleDayClick(day: Date) {
    if (onSelectDate) {
      onSelectDate(day);
      return;
    }
    onEmptySlotClick?.({
      date: day,
      startTime: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 0, 0, 0),
      endTime: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 10, 0, 0, 0),
      view: 'month',
    });
  }

  return (
    <section className='bg-card w-full min-w-0 overflow-hidden rounded-md border shadow-sm'>
      <div className='border-b px-3 py-3 sm:px-4'>
        <div className='flex items-center justify-between gap-2'>
          <div>
            <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
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

      <div className='w-full min-w-0'>
        <div
          className='bg-muted/40 grid w-full border-b'
          style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
        >
          {weekLabels.map(label => (
            <div key={label} className='px-2 py-2 text-center text-xs font-semibold'>
              {label}
            </div>
          ))}
        </div>

        <div className='grid w-full' style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
          {days.map(day => {
            const dayEvents = getDayEvents(events, day);
            const hasCancelledEvents = dayEvents.some(event => isCancelledStatus(event.status));

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-28 cursor-pointer border-r border-b p-2 last:border-r-0 sm:min-h-32',
                  !isSameMonth(day, currentDate) && 'bg-muted/20 text-muted-foreground'
                )}
                role='button'
                tabIndex={0}
                aria-label={`Go to ${day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}`}
                onClick={() => handleDayClick(day)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleDayClick(day);
                  }
                }}
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
                <div className='cursor-pointer space-y-1'>
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
  onSelectDate,
}: {
  currentDate: Date;
  events: SchedulerEvent[];
  onSelectDate?: (date: Date) => void;
}) {
  const today = new Date();

  const months = Array.from(
    { length: 12 },
    (_, index) => new Date(currentDate.getFullYear(), index, 1)
  );

  return (
    <section className='bg-card grid w-full min-w-0 gap-3 overflow-hidden rounded-md border p-3 shadow-sm sm:grid-cols-2 xl:grid-cols-3'>
      {months.map(month => {
        const monthEvents = getMonthEvents(events, month);

        const monthDays = getMonthDays(month);

        const monthCancelledEventDays = new Set(
          monthEvents
            .filter(event => isCancelledStatus(event.status))
            .map(event => getCalendarKey(event.startTime))
        );

        return (
          <div key={month.toISOString()} className='bg-background rounded-md border p-3'>
            <div className='mb-3 flex items-center justify-between gap-2'>
              <h3 className='text-foreground text-sm font-semibold'>
                {month.toLocaleDateString('en-US', { month: 'long' })}
              </h3>

              <span className='text-muted-foreground text-xs'>{monthEvents.length} sessions</span>
            </div>

            <div className='text-muted-foreground mb-2 grid grid-cols-7 text-[10px] font-semibold'>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => (
                <span key={`${month.toISOString()}-${label}-${index}`} className='text-center'>
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
                    aria-label={`Go to the week of ${day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}`}
                    className={cn(
                      'hover:bg-muted relative flex aspect-square cursor-pointer items-center justify-center rounded text-[11px] font-semibold transition-colors',
                      inMonth ? 'text-foreground' : 'text-muted-foreground/50',
                      isSameCalendarDay(day, today) &&
                        (hasCancelledEvents
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-primary text-primary-foreground'),
                      hasEvents &&
                        !isSameCalendarDay(day, today) &&
                        (hasCancelledEvents
                          ? 'bg-destructive/10 ring-destructive/30 ring-1'
                          : 'bg-primary/10 ring-primary/30 ring-1')
                    )}
                    onClick={e => {
                      e.stopPropagation();
                      // Any day click — with or without events — jumps to the
                      // week containing that day, with the day itself selected.
                      onSelectDate?.(day);
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
                      <span className='bg-background absolute top-0.5 right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border px-1 text-[8px] leading-none font-bold'>
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
  );
}

export function SchedulerGrid({
  currentDate,
  events,
  view,
  onEventClick,
  onEmptySlotClick,
  onSelectDate,
  canCreateClass = false,
  onClassCreated,
}: {
  currentDate: Date;
  events: SchedulerEvent[];
  view: SchedulerView;
  onEventClick?: (event: SchedulerEvent) => void;
  onEmptySlotClick?: (slot: EmptySlot) => void;
  /** Called when a day cell is clicked in Month or Year view — the parent owns
   * switching `currentDate`/`view` (Month -> that day's Day view, Year -> the
   * week containing that day). */
  onSelectDate?: (date: Date) => void;
  /** Gates the click-to-create-class modal in Day/Week views. Pass `true` for
   * instructor and organisation profiles only. */
  canCreateClass?: boolean;
  onClassCreated?: () => void;
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
        canCreateClass={canCreateClass}
        onClassCreated={onClassCreated}
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
        onSelectDate={onSelectDate}
      />
    );
  }

  if (view === 'year') {
    return <YearGrid currentDate={currentDate} events={events} onSelectDate={onSelectDate} />;
  }

  return (
    <WeekGrid
      currentDate={currentDate}
      currentTime={currentTime}
      events={events}
      onEventClick={onEventClick}
      onEmptySlotClick={onEmptySlotClick}
      canCreateClass={canCreateClass}
      onClassCreated={onClassCreated}
    />
  );
}
