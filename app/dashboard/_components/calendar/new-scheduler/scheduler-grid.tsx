import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { categoryStyles, schedulerDays, schedulerEvents, schedulerHours } from './data';
import type { SchedulerEvent } from './types';

const rowHeight = 58;
const timeColumnClass =
  'grid-cols-[48px_repeat(7,minmax(0,1fr))] sm:grid-cols-[60px_repeat(7,minmax(0,1fr))] lg:grid-cols-[68px_repeat(7,minmax(0,1fr))]';

function formatHour(hour: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalized = hour > 12 ? hour - 12 : hour;
  return `${normalized}:00 ${suffix}`;
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
        top: `${(event.startHour % 1) * rowHeight + 6}px`,
        height: `${Math.max(event.duration * rowHeight - 10, 50)}px`,
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

export function SchedulerGrid() {
  return (
    <section className='bg-card min-w-0 flex-1 overflow-hidden rounded-md border shadow-sm'>
      <div className={cn('bg-muted/40 grid w-full border-b', timeColumnClass)}>
        <div className='text-foreground px-1 py-2 text-center text-[10px] font-semibold sm:px-2 sm:text-xs'>
          Time
        </div>
        {schedulerDays.map((day, index) => (
          <div
            key={`${day.label}-${day.date}`}
            className={cn(
              'border-l px-1 py-2 text-center text-[10px] font-semibold sm:px-2 sm:text-xs lg:text-sm',
              index === 1 && 'bg-primary text-primary-foreground'
            )}
          >
            <span className='block sm:inline'>{day.label}</span>
            <span className='sm:ml-1'>{day.date}</span>
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
                <div key={`${day.label}-${hour}`} className='border-l' />
              ))}
            </div>
          ))}

          <div className='pointer-events-none absolute top-0 right-0 left-[48px] h-full sm:left-[60px] lg:left-[68px]'>
            <div
              className='border-destructive absolute right-0 left-0 z-10 border-t'
              style={{ top: `${rowHeight * 5}px` }}
            >
              <span className='bg-background text-destructive absolute -top-2 left-2 text-[10px] font-semibold'>
                03:25 PM
              </span>
            </div>
          </div>

          <div className='absolute top-0 right-0 left-[48px] sm:left-[60px] lg:left-[68px]'>
            <div className='grid grid-cols-7'>
              {schedulerDays.map((day, dayIndex) => (
                <div
                  key={day.label}
                  className='relative border-l'
                  style={{ height: `${schedulerHours.length * rowHeight}px` }}
                >
                  {schedulerEvents
                    .filter(event => event.dayIndex === dayIndex)
                    .map(event => (
                      <div
                        key={event.id}
                        className='absolute right-0 left-0'
                        style={{ top: `${(event.startHour - 8) * rowHeight}px` }}
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
