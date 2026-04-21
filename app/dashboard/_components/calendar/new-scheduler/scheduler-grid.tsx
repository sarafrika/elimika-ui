import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { categoryStyles, schedulerHours } from './data';
import type { SchedulerEvent, SchedulerView } from './types';

const rowHeight = 58;
const timeColumnClass =
  'grid-cols-[48px_repeat(7,minmax(0,1fr))] sm:grid-cols-[60px_repeat(7,minmax(0,1fr))] lg:grid-cols-[68px_repeat(7,minmax(0,1fr))]';

function formatHour(hour: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalized = hour > 12 ? hour - 12 : hour;
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

function getMonthDays(currentDate: Date) {
  const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const gridStart = getWeekStart(firstOfMonth);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function getStartHour(event: SchedulerEvent) {
  return event.startTime.getHours() + event.startTime.getMinutes() / 60;
}

function getDurationHours(event: SchedulerEvent) {
  return Math.max((event.endTime.getTime() - event.startTime.getTime()) / 36e5, 0.75);
}

function EventBlock({ event }: { event: SchedulerEvent }) {
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

function CompactEvent({ event }: { event: SchedulerEvent }) {
  return (
    <div
      className={cn(
        'min-w-0 rounded border px-2 py-1 text-left text-[10px] font-semibold',
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

function EmptySchedule({ label }: { label: string }) {
  return (
    <section className='bg-card flex min-h-[420px] min-w-0 flex-1 items-center justify-center rounded-md border p-6 text-center shadow-sm'>
      <div>
        <p className='text-foreground text-sm font-semibold'>No schedules found</p>
        <p className='text-muted-foreground mt-1 text-xs'>{label}</p>
      </div>
    </section>
  );
}

function WeekGrid({ currentDate, events }: { currentDate: Date; events: SchedulerEvent[] }) {
  const schedulerDays = getWeekDays(currentDate);
  const today = new Date();

  return (
    <section className='bg-card min-w-0 flex-1 overflow-hidden rounded-md border shadow-sm'>
      <div className={cn('bg-muted/40 grid w-full border-b', timeColumnClass)}>
        <div className='text-foreground px-1 py-2 text-center text-[10px] font-semibold sm:px-2 sm:text-xs'>
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

      <div className='bg-background max-h-[640px] overflow-x-hidden overflow-y-auto'>
        <div className='relative w-full'>
          {schedulerHours.map(hour => (
            <div
              key={hour}
              className={cn('grid border-b last:border-b-0', timeColumnClass)}
              style={{ height: `${rowHeight}px` }}
            >
              <div className='text-muted-foreground px-1 py-2 text-right text-[9px] font-semibold sm:px-2 sm:text-[10px] lg:text-xs'>
                {formatHour(hour)}
              </div>
              {schedulerDays.map(day => (
                <div key={`${day.toISOString()}-${hour}`} className='border-l' />
              ))}
            </div>
          ))}

          <div className='absolute top-0 right-0 left-[48px] sm:left-[60px] lg:left-[68px]'>
            <div className='grid grid-cols-7'>
              {schedulerDays.map(day => (
                <div
                  key={day.toISOString()}
                  className='relative border-l'
                  style={{ height: `${schedulerHours.length * rowHeight}px` }}
                >
                  {events
                    .filter(event => isSameCalendarDay(event.startTime, day))
                    .map(event => (
                      <div
                        key={event.id}
                        className='absolute right-0 left-0'
                        style={{
                          top: `${Math.max(getStartHour(event) - (schedulerHours[0] ?? 8), 0) * rowHeight}px`,
                        }}
                      >
                        <EventBlock event={event} />
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MonthGrid({ currentDate, events }: { currentDate: Date; events: SchedulerEvent[] }) {
  const days = getMonthDays(currentDate);
  const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();

  return (
    <section className='bg-card min-w-0 flex-1 overflow-hidden rounded-md border shadow-sm'>
      <div className='bg-muted/40 grid grid-cols-7 border-b'>
        {weekLabels.map(label => (
          <div key={label} className='px-2 py-2 text-center text-xs font-semibold'>
            {label}
          </div>
        ))}
      </div>

      <div className='grid grid-cols-7'>
        {days.map(day => {
          const dayEvents = events
            .filter(event => isSameCalendarDay(event.startTime, day))
            .sort((left, right) => left.startTime.getTime() - right.startTime.getTime());

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-28 border-r border-b p-2 last:border-r-0 sm:min-h-32',
                !isSameMonth(day, currentDate) && 'bg-muted/20 text-muted-foreground'
              )}
            >
              <div className='mb-2 flex items-center justify-between gap-2'>
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded text-xs font-semibold',
                    isSameCalendarDay(day, today) && 'bg-primary text-primary-foreground'
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
                  <CompactEvent key={event.id} event={event} />
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
    </section>
  );
}

function YearGrid({ currentDate, events }: { currentDate: Date; events: SchedulerEvent[] }) {
  const months = Array.from(
    { length: 12 },
    (_, index) => new Date(currentDate.getFullYear(), index, 1)
  );

  return (
    <section className='grid min-w-0 flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
      {months.map(month => {
        const monthEvents = events
          .filter(event => isSameMonth(event.startTime, month))
          .sort((left, right) => left.startTime.getTime() - right.startTime.getTime());

        return (
          <div key={month.toISOString()} className='bg-card rounded-md border p-3 shadow-sm'>
            <div className='mb-3 flex items-center justify-between gap-2'>
              <h3 className='text-foreground text-sm font-semibold'>
                {month.toLocaleDateString('en-US', { month: 'long' })}
              </h3>
              <span className='text-muted-foreground text-xs'>{monthEvents.length} sessions</span>
            </div>
            <div className='space-y-2'>
              {monthEvents.slice(0, 4).map(event => (
                <div key={event.id} className='bg-muted/40 min-w-0 rounded-md p-2'>
                  <p className='text-foreground truncate text-xs font-semibold'>{event.title}</p>
                  <p className='text-muted-foreground truncate text-[11px]'>
                    {event.startTime.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    · {event.instructor}
                  </p>
                </div>
              ))}
              {!monthEvents.length ? (
                <p className='text-muted-foreground bg-muted/40 rounded-md p-2 text-xs'>
                  No sessions this month.
                </p>
              ) : null}
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
}: {
  currentDate: Date;
  events: SchedulerEvent[];
  view: SchedulerView;
}) {
  if (!events.length) {
    return <EmptySchedule label='Try changing the date range or clearing filters.' />;
  }

  if (view === 'month') {
    return <MonthGrid currentDate={currentDate} events={events} />;
  }

  if (view === 'year') {
    return <YearGrid currentDate={currentDate} events={events} />;
  }

  return <WeekGrid currentDate={currentDate} events={events} />;
}
