import { Popover, PopoverContent, PopoverTrigger } from '@/components/tiptap-ui-primitive/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Building2, CalendarDays, MapPin, Plus, Video, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useUserDomain } from '../../../../../context/user-domain-context';
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

// Week view uses its own metric because it anchors against the first hour in
// `schedulerHours` rather than midnight.
function getEventTimeOffsets(event: SchedulerEvent) {
  const firstHour = schedulerHours[0] ?? 0;

  const dayStart = new Date(event.startTime);
  dayStart.setHours(firstHour, 0, 0, 0);

  const startMinutes = (event.startTime.getTime() - dayStart.getTime()) / (1000 * 60);
  const durationMinutes = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
  const pixelsPerMinute = rowHeight / 60;

  return {
    top: Math.max(startMinutes, 0) * pixelsPerMinute,
    height: Math.max(durationMinutes, 15) * pixelsPerMinute,
  };
}

function getEventStartMs(event: SchedulerEvent) {
  return event.startTime.getTime();
}

function getEventEndMs(event: SchedulerEvent) {
  return event.endTime.getTime();
}

function overlapsInTime(left: SchedulerEvent, right: SchedulerEvent) {
  return getEventStartMs(left) < getEventEndMs(right) && getEventEndMs(left) > getEventStartMs(right);
}

function sortByStartThenEnd(events: SchedulerEvent[]) {
  return [...events].sort(
    (left, right) =>
      getEventStartMs(left) - getEventStartMs(right) ||
      getEventEndMs(left) - getEventEndMs(right) ||
      left.id.localeCompare(right.id)
  );
}

function getCollisionGroups(events: SchedulerEvent[]) {
  if (!events.length) return [];

  const sorted = sortByStartThenEnd(events);

  const groups: SchedulerEvent[][] = [];
  let currentGroup: SchedulerEvent[] = [];
  let currentGroupEnd = 0;

  sorted.forEach(event => {
    const start = getEventStartMs(event);
    const end = getEventEndMs(event);

    if (!currentGroup.length) {
      currentGroup = [event];
      currentGroupEnd = end;
      return;
    }

    if (start < currentGroupEnd) {
      currentGroup.push(event);
      currentGroupEnd = Math.max(currentGroupEnd, end);
      return;
    }

    groups.push(currentGroup);
    currentGroup = [event];
    currentGroupEnd = end;
  });

  if (currentGroup.length) {
    groups.push(currentGroup);
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Cascade layout: within a cluster of time-overlapping events, the earliest
// event renders full width and sits at the back; each subsequent event is
// narrower (100% / 80% / 60% / 50%) and stacks on top of it. All entries are
// anchored to the right edge, and narrower (later) entries get a higher
// z-index, so each event's left edge stays visible as a "peek" strip you can
// hover/click. Anything past the 4th event in a cluster collapses into a
// "+N more" chip in the open space on the left.
// ---------------------------------------------------------------------------

const CASCADE_WIDTHS = [100, 80, 60, 50];
const CASCADE_MAX_VISIBLE = CASCADE_WIDTHS.length;

type CascadeEntry = {
  event: SchedulerEvent;
  top: number;
  height: number;
  width: number;
  zIndex: number;
  groupEvents: SchedulerEvent[];
};

type CascadeOverflow = {
  anchorTop: number;
  anchorWidth: number;
  events: SchedulerEvent[];
};

type CascadeLayout = {
  entries: CascadeEntry[];
  overflow: CascadeOverflow[];
};

function layoutCascade(
  events: SchedulerEvent[],
  getMetrics: (event: SchedulerEvent) => { top: number; height: number }
): CascadeLayout {
  const groups = getCollisionGroups(events);
  const entries: CascadeEntry[] = [];
  const overflow: CascadeOverflow[] = [];

  groups.forEach(group => {
    const sorted = sortByStartThenEnd(group);
    const visible = sorted.slice(0, CASCADE_MAX_VISIBLE);
    const hidden = sorted.slice(CASCADE_MAX_VISIBLE);

    visible.forEach((event, index) => {
      const { top, height } = getMetrics(event);
      const width = CASCADE_WIDTHS[index] ?? CASCADE_WIDTHS[CASCADE_WIDTHS.length - 1];

      entries.push({
        event,
        top,
        height,
        width,
        zIndex: 10 + index,
        groupEvents: sorted,
      });
    });

    if (hidden.length) {
      const anchor = visible[visible.length - 1] ?? sorted[0];
      const anchorMetrics = getMetrics(anchor);
      const anchorWidth =
        CASCADE_WIDTHS[visible.length - 1] ?? CASCADE_WIDTHS[CASCADE_WIDTHS.length - 1];

      overflow.push({
        anchorTop: anchorMetrics.top,
        anchorWidth,
        events: hidden,
      });
    }
  });

  return { entries, overflow };
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

function EventBlock({ event }: { event: SchedulerEvent }) {
  return (
    <button
      type='button'
      className={cn(
        'focus-visible:ring-ring h-full w-full cursor-pointer overflow-hidden rounded-md border border-l-4 px-1 py-1 text-left shadow-sm transition hover:shadow-md focus-visible:ring-2 focus-visible:outline-none sm:px-1.5 lg:p-2',
        getEventStyles(event)
      )}
    >
      <p className='truncate text-[9px] font-semibold sm:text-[10px] lg:text-xs'>{event.title}</p>

      <p className='hidden truncate text-[9px] opacity-80 sm:block lg:text-[11px]'>
        {event.instructor}
      </p>

      <p className='hidden truncate text-[9px] opacity-75 md:block lg:text-[11px]'>
        {event.location}
      </p>

      {/* <div className='mt-1 hidden items-center gap-1 lg:flex'>
        {event.students.slice(0, 3).map(student => (
          <Avatar key={student} className='h-5 w-5 border'>
            <AvatarFallback className='text-[8px]'>{student}</AvatarFallback>
          </Avatar>
        ))}

        <span className='text-[10px] opacity-75'>+{event.students.length + 7}</span>
      </div> */}
    </button>
  );
}

function WeekEventBlock({ event }: { event: SchedulerEvent }) {
  return (
    <button
      type='button'
      className={cn(
        'focus-visible:ring-ring h-full w-full cursor-pointer overflow-hidden rounded-md border border-l-4 px-2 py-1 text-left shadow-sm transition hover:shadow-md focus-visible:ring-2 focus-visible:outline-none',
        getEventStyles(event)
      )}
    >
      <p className='truncate text-[10px] font-semibold sm:text-[11px]'>
        {event.title}
      </p>

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

      <p className='hidden truncate text-[9px] opacity-75 sm:block'>
        {event.location}
      </p>
    </button>
  );
}

function CompactEvent({ event }: { event: SchedulerEvent }) {
  return (
    <button
      type="button"
      className={cn(
        'w-full min-w-0 max-w-full overflow-hidden rounded border border-l-[3px] px-2 py-1 text-left text-[10px] font-semibold transition hover:shadow-sm',
        getEventStyles(event)
      )}
    >
      <p className="min-w-0 truncate">{event.title}</p>
      <p className="min-w-0 truncate opacity-75">
        {event.startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })}
      </p>
    </button>
  );
}

function SchedulerEventDisclosure({
  event,
  overlapEvents,
  onViewDetails,
  children,
}: {
  event: SchedulerEvent;
  overlapEvents: SchedulerEvent[];
  onViewDetails?: (event: SchedulerEvent) => void;
  children: ReactElement;
}) {
  const hasOverlap = overlapEvents.length > 1;
  const joinHref = event.meetingLink?.trim() || '';

  return (
    <Popover>
      {/* `h-full` here is required: without it this div shrinks to its
          content's natural height instead of filling the absolutely
          positioned wrapper above it, which is what caused event blocks to
          render shorter than their actual duration. */}
      <div className='group relative h-full'>
        {/* Hover preview — only the currently hovered event */}
        <div className='pointer-events-none absolute bottom-full left-0 z-100 mb-2 hidden w-[min(18rem,calc(100vw-1rem))] rounded-xl border border-border/60 bg-card/95 p-3 text-left shadow-2xl backdrop-blur group-hover:block group-focus-within:block'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <p className='truncate text-xs font-semibold text-foreground'>
                {event.title}
              </p>

              <p className='mt-0.5 truncate text-[10px] text-muted-foreground'>
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
            </div>

            {hasOverlap ? (
              <span className='shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground'>
                +{overlapEvents.length - 1} overlapping
              </span>
            ) : null}
          </div>
        </div>

        <PopoverTrigger asChild>{children}</PopoverTrigger>
      </div>

      {/* Full event details */}
      <PopoverContent
        align='start'
        side='top'
        sideOffset={10}
        className='w-[min(19rem,calc(100vw-1rem))] rounded-xl border border-border/60 bg-card p-0 shadow-2xl'
      >
        <div className='border-b border-border/60 px-4 py-3'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <p className='text-foreground truncate text-sm font-semibold'>
                {event.title}
              </p>

              <p className='text-muted-foreground mt-0.5 text-xs'>
                {event.startTime.toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
                {' · '}
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
            </div>
          </div>
        </div>

        <div className='space-y-3 px-4 py-4'>
          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm'>
              <CalendarDays className='text-muted-foreground h-4 w-4 shrink-0' />
              <span className='min-w-0 truncate'>{event.course}</span>
            </div>

            {event.organisationName ? (
              <div className='flex items-center gap-2 text-sm'>
                <Building2 className='text-muted-foreground h-4 w-4 shrink-0' />
                <span className='min-w-0 truncate'>{event.organisationName}</span>
              </div>
            ) : null}

            <div className='flex items-center gap-2 text-sm'>
              <MapPin className='text-muted-foreground h-4 w-4 shrink-0' />
              <span className='min-w-0 truncate'>{event.location}</span>
            </div>

            <div className='flex items-center gap-2 text-sm'>
              <Video className='text-muted-foreground h-4 w-4 shrink-0' />
              <span className='min-w-0 truncate'>
                {event.meetingLink
                  ? 'Meeting link available'
                  : 'No meeting link available'}
              </span>
            </div>
          </div>

          {hasOverlap ? (
            <div className='rounded-lg border border-border/60 bg-muted/30 px-3 py-2'>
              <p className='text-[10px] font-medium text-muted-foreground'>
                This event overlaps with {overlapEvents.length - 1} other{' '}
                {overlapEvents.length - 1 === 1 ? 'event' : 'events'}.
              </p>
            </div>
          ) : null}

          <div className='grid gap-2'>
            {joinHref ? (
              <Button asChild className='w-full'>
                <a
                  href={joinHref}
                  target='_blank'
                  rel='noreferrer noopener'
                >
                  Join Class
                </a>
              </Button>
            ) : null}

            {onViewDetails && event.instanceUuid ? (
              <Button
                variant={joinHref ? 'outline' : 'default'}
                className='w-full'
                onClick={() => onViewDetails(event)}
              >
                View Details
              </Button>
            ) : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function OverflowChip({ events }: { events: SchedulerEvent[] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type='button'
          className='flex h-full w-full items-center justify-center rounded-md border bg-background/95 text-[9px] font-semibold text-muted-foreground shadow-sm transition hover:text-foreground sm:text-[10px]'
        >
          +{events.length} more
        </button>
      </PopoverTrigger>

      <PopoverContent
        align='end'
        side='top'
        sideOffset={8}
        className='w-[min(16rem,calc(100vw-1rem))] rounded-xl border border-border/60 bg-card p-2 shadow-2xl'
      >
        <p className='mb-1 px-1 text-[10px] font-semibold text-muted-foreground'>
          {events.length} more event{events.length === 1 ? '' : 's'}
        </p>

        <div className='max-h-56 space-y-1 overflow-y-auto'>
          {events.map(event => (
            <div key={event.id} className='rounded-md px-2 py-1 text-xs hover:bg-muted/60'>
              <p className='truncate font-medium'>{event.title}</p>
              <p className='truncate text-[10px] text-muted-foreground'>
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
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
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

  const dayCascade = useMemo(
    () =>
      layoutCascade(dayEvents, event => ({
        top: getEventTop(event),
        height: getEventHeight(event),
      })),
    [dayEvents]
  );

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
      <section className='bg-card flex w-full flex-col overflow-visible rounded-md border shadow-sm'>
        <div className='grid gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_260px] lg:p-4'>
          {/* LEFT SCHEDULE */}
          <div className='min-w-0'>
            <div className='bg-background/95 sticky top-0 z-30 grid grid-cols-[72px_1fr] rounded-t-md border border-b-0 border-border/60 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/90'>
              <div className='px-2 py-2 text-center text-[10px] font-semibold sm:text-xs'>Time</div>

              <div className='px-2 py-2 text-center text-[10px] font-semibold sm:text-xs'>
                Schedule
              </div>
            </div>

            <div className='bg-background rounded-b-md border border-t-0'>
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

                <div className='pointer-events-none absolute inset-0 left-[72px]'>
                  {dayCascade.entries.map(({ event, top, height, width, zIndex, groupEvents }) => (
                    <div
                      key={event.id}
                      // `bg-card` gives this wrapper its own opaque backdrop.
                      // Without it, a translucent category color would blend
                      // with whatever event is stacked behind it instead of
                      // fully covering it, showing both cards' text at once.
                      className='pointer-events-auto absolute rounded-md bg-card px-0.5'
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        right: '0%',
                        width: `${width}%`,
                        zIndex,
                      }}
                    >
                      <SchedulerEventDisclosure
                        event={event}
                        overlapEvents={groupEvents}
                        onViewDetails={onEventClick}
                      >
                        <EventBlock event={event} />
                      </SchedulerEventDisclosure>
                    </div>
                  ))}

                  {dayCascade.overflow.map((item, index) => (
                    <div
                      key={`overflow-${index}`}
                      className='pointer-events-auto absolute z-40 px-0.5'
                      style={{
                        top: `${item.anchorTop}px`,
                        height: '20px',
                        left: '0%',
                        width: `${100 - item.anchorWidth}%`,
                      }}
                    >
                      <OverflowChip events={item.events} />
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
  onCreateClass,
  onBlockTime,
}: {
  currentDate: Date;
  currentTime: Date;
  events: SchedulerEvent[];
  onEventClick?: (event: SchedulerEvent) => void;
  onEmptySlotClick?: (slot: EmptySlot) => void;
  canCreateClass?: boolean;
  onCreateClass?: (slot: EmptySlot) => void;
  onBlockTime?: (slot: EmptySlot) => void;
}) {
  const { activeDomain } = useUserDomain();

  const schedulerDays = getWeekDays(currentDate);

  const [selectedSlot, setSelectedSlot] = useState<EmptySlot | null>(null);

  function handleSlotClick(slot: EmptySlot) {
    if (canCreateClass) {
      setSelectedSlot(prev => {
        if (
          prev?.startTime.getTime() === slot.startTime.getTime() &&
          prev?.date.getTime() === slot.date.getTime()
        ) {
          return null;
        }

        return slot;
      });

      return;
    }

    onEmptySlotClick?.(slot);
  }

  function handleCreateClass() {
    if (!selectedSlot) return;

    onCreateClass?.(selectedSlot);
    setSelectedSlot(null);
  }

  function handleBlockTime() {
    if (!selectedSlot) return;

    onBlockTime?.(selectedSlot);
    setSelectedSlot(null);
  }

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSlotLongPressStart = (slot: EmptySlot) => {
    longPressTimer.current = setTimeout(() => {
      handleSlotClick(slot);
    }, 500);
  };

  const handleSlotLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleSlotContextMenu = (
    event: React.MouseEvent,
    slot: EmptySlot
  ) => {
    event.preventDefault();
    handleSlotClick(slot);
  };

  useEffect(() => {
    if (!selectedSlot) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest('[data-slot-actions]')) {
        setSelectedSlot(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedSlot(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [selectedSlot]);

  return (
    <section className='bg-card ring-border/60 flex w-full min-w-0 flex-col overflow-visible rounded-md shadow-sm ring-1'>
      <div className='bg-background relative w-full min-w-0'>
        {/* HEADER */}
        <div className='bg-background/95 sticky top-0 z-30 rounded-t-md border border-b-0 border-border/60 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/90'>
          <div
            className={cn(
              'grid border-b border-border/60',
              weekColumnClass
            )}
          >
            <div className='px-2 py-2 text-center text-xs font-semibold'>
              Time
            </div>

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
        <div className='bg-background rounded-b-md border border-t-0'>
          <div
            className='relative'
            style={{
              height: `${schedulerHours.length * rowHeight}px`,
            }}
          >
            {/* TIME GRID */}
            {schedulerHours.map(hour => (
              <div
                key={hour}
                className={cn(
                  'grid border-b last:border-b-0',
                  weekColumnClass
                )}
                style={{
                  height: `${rowHeight}px`,
                }}
              >
                <div className='text-muted-foreground px-2 py-2 text-right text-[9px] font-semibold'>
                  {formatHour(hour)}
                </div>

                {schedulerDays.map(day => {
                  const slot: EmptySlot = {
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
                  };

                  const isSelected =
                    selectedSlot?.startTime.getTime() ===
                    slot.startTime.getTime() &&
                    selectedSlot?.date.getTime() ===
                    slot.date.getTime();

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={cn(
                        'relative border-l select-none',
                        canCreateClass || onEmptySlotClick
                          ? 'cursor-pointer'
                          : 'cursor-default',
                        isSelected && 'bg-muted/50'
                      )}
                      onClick={() => handleSlotClick(slot)}
                    >
                      {isSameCalendarDay(day, currentTime) &&
                        currentTime.getHours() === hour ? (
                        <CurrentTimeIndicator
                          currentTime={currentTime}
                        />
                      ) : null}

                      {/* ACTION POPOVER */}
                      {isSelected && canCreateClass && (
                        <div
                          data-slot-actions
                          className='absolute left-1/2 top-1/2 z-50 w-48 -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-popover p-2 shadow-lg'
                          onClick={event => event.stopPropagation()}
                        >
                          <div className='relative mb-2 px-2 py-1 pr-7'>
                            <p className='text-xs font-medium'>
                              {slot.startTime.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>

                            <p className='text-muted-foreground text-[11px]'>
                              What would you like to do?
                            </p>

                            <button
                              type='button'
                              aria-label='Close'
                              onClick={() => setSelectedSlot(null)}
                              className='text-muted-foreground hover:text-foreground hover:bg-muted absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-md transition-colors'
                            >
                              <X className='h-3.5 w-3.5' />
                            </button>
                          </div>

                          <div className='flex flex-col gap-1'>
                            {activeDomain === 'instructor' && (
                              <Button
                                onClick={handleCreateClass}
                                className='flex w-full items-center justify-start rounded-md py-2 text-xs font-medium transition-colors'
                              >
                                <Plus className='h-4 w-4' />
                                Create new class
                              </Button>
                            )}

                            {(activeDomain === 'organisation_user' ||
                              activeDomain === 'organisation') && (
                                <Button
                                  onClick={handleCreateClass}
                                  className='flex w-full items-center justify-start rounded-md py-2 text-xs font-medium transition-colors'
                                >
                                  <Plus className='h-4 w-4' />
                                  Post new job
                                </Button>
                              )}

                            <Button
                              onClick={handleBlockTime}
                              className='flex w-full items-center justify-start rounded-md py-2 text-xs font-medium transition-colors'
                            >
                              <Plus className='h-4 w-4' />
                              Block time
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* EVENTS OVERLAY */}
            <div
              className={cn(
                'pointer-events-none absolute inset-0 grid',
                weekColumnClass
              )}
            >
              {/* Time column spacer */}
              <div />

              {schedulerDays.map(day => {
                const dayEvents = events.filter(event => isSameCalendarDay(event.startTime, day));
                const cascade = layoutCascade(dayEvents, getEventTimeOffsets);

                return (
                  <div
                    key={day.toISOString()}
                    className='pointer-events-none relative min-w-0 border-l'
                  >
                    {cascade.entries.map(({ event, top, height, width, zIndex, groupEvents }) => (
                      <div
                        key={event.id}
                        // `bg-card` gives this wrapper its own opaque backdrop.
                        // Without it, a translucent category color would blend
                        // with whatever event is stacked behind it instead of
                        // fully covering it, showing both cards' text at once.
                        className='pointer-events-auto absolute rounded-md bg-card px-0.5'
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          right: '0%',
                          width: `${width}%`,
                          zIndex,
                        }}
                      >
                        <SchedulerEventDisclosure
                          event={event}
                          overlapEvents={groupEvents}
                          onViewDetails={onEventClick}
                        >
                          <WeekEventBlock event={event} />
                        </SchedulerEventDisclosure>
                      </div>
                    ))}

                    {cascade.overflow.map((item, index) => (
                      <div
                        key={`overflow-${index}`}
                        className='pointer-events-auto absolute z-40 px-0.5'
                        style={{
                          top: `${item.anchorTop}px`,
                          height: '20px',
                          left: '0%',
                          width: `${100 - item.anchorWidth}%`,
                        }}
                      >
                        <OverflowChip events={item.events} />
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
    <section className='bg-card w-full min-w-0 overflow-visible rounded-md border shadow-sm'>
      <div className='w-full min-w-0'>
        <div className='sticky top-0 z-30 bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/90'>
          <div className='border-b border-border/60 px-3 py-3 sm:px-4'>
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

          <div
            className='bg-muted/40 grid w-full border-b border-border/60'
            style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
          >
            {weekLabels.map(label => (
              <div key={label} className='px-2 py-2 text-center text-xs font-semibold'>
                {label}
              </div>
            ))}
          </div>
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
                    <SchedulerEventDisclosure
                      key={event.id}
                      event={event}
                      overlapEvents={[event]}
                      onViewDetails={onEventClick}
                    >
                      <CompactEvent event={event} />
                    </SchedulerEventDisclosure>
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
      // onClassCreated={onClassCreated}
      onCreateClass={slot => {
        // Open your create class dialog/page
      }}
      onBlockTime={slot => {
        // Open block-time dialog/page
      }}

    />
  );
}