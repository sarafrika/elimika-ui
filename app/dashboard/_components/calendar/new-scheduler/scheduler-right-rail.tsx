import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, MapPin } from 'lucide-react';
import { categoryStyles, studentMetric } from './data';
import type { SchedulerEvent } from './types';

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function isSameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function SchedulerRightRail({
  events,
  instructors,
}: {
  events: SchedulerEvent[];
  instructors: string[];
}) {
  const todayEvents = events.filter(event => isSameCalendarDay(event.startTime, new Date()));
  const visibleSchedule = todayEvents.length ? todayEvents.slice(0, 5) : events.slice(0, 5);
  const visibleSeats =
    events.reduce((total, event) => total + (event.maxParticipants ?? event.students.length), 0) ||
    studentMetric.value;

  return (
    <aside className='grid min-w-0 gap-3 2xl:w-80 2xl:shrink-0'>
      <section className='bg-card rounded-md border p-3 shadow-sm'>
        <div className='mb-3 flex items-center justify-between gap-3'>
          <h2 className='text-foreground text-sm font-semibold sm:text-base'>
            Today&apos;s Schedule
          </h2>
          <span className='text-muted-foreground text-xs'>{visibleSchedule.length} sessions</span>
        </div>
        <div className='space-y-2'>
          {visibleSchedule.map(event => (
            <div key={event.id} className='grid grid-cols-[58px_1fr_auto] items-start gap-2'>
              <span className='text-foreground text-[11px] font-semibold'>
                {formatTime(event.startTime)}
              </span>
              <div className='min-w-0'>
                <Badge
                  className={`mb-1 h-5 rounded px-1.5 text-[9px] ${categoryStyles[event.category]}`}
                >
                  {event.course}
                </Badge>
                <p className='text-foreground truncate text-xs font-semibold'>{event.title}</p>
                <p className='text-muted-foreground truncate text-[11px]'>
                  {event.instructor} · {event.location}
                </p>
              </div>
              <Button size='sm' variant='secondary' className='h-7 rounded px-2 text-xs'>
                Start
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className='bg-card rounded-md border p-3 shadow-sm'>
        <div className='mb-2 flex items-center justify-between'>
          <h2 className='text-foreground text-sm font-semibold'>Instructors</h2>
          <span className='text-muted-foreground text-xs'>{instructors.length} visible</span>
        </div>
        <div className='space-y-2'>
          {(instructors.length ? instructors : ['Instructor pending'])
            .slice(0, 6)
            .map(instructor => (
              <div key={instructor} className='bg-muted/40 flex items-center gap-2 rounded-md p-2'>
                <Avatar className='h-7 w-7 border'>
                  <AvatarFallback className='text-[10px]'>
                    {instructor
                      .split(' ')
                      .map(part => part.charAt(0))
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className='text-foreground truncate text-xs font-medium'>{instructor}</span>
              </div>
            ))}
        </div>
      </section>

      <section className='bg-card rounded-md border p-3 shadow-sm'>
        <div className='mb-2 flex items-center justify-between'>
          <h2 className='text-foreground text-sm font-semibold'>Students</h2>
          <span className='text-muted-foreground text-xs'>{events.length} sessions</span>
        </div>
        <p className='text-foreground text-sm font-semibold'>{visibleSeats} Seats Visible</p>
        <div className='mt-3 flex items-center gap-2'>
          {['AJ', 'MW', 'SK', 'DN', 'EL', 'TR'].map(student => (
            <Avatar key={student} className='h-8 w-8 border'>
              <AvatarFallback className='text-[10px]'>{student}</AvatarFallback>
            </Avatar>
          ))}
          <Button size='sm' variant='secondary' className='ml-auto h-8 rounded px-3 text-xs'>
            Start
          </Button>
        </div>
      </section>

      <section className='bg-card rounded-md border p-3 shadow-sm'>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-foreground text-sm font-semibold'>Location</h2>
          <Button variant='ghost' size='sm' className='h-7 px-2 text-xs'>
            Manage
          </Button>
        </div>
        <div className='flex items-center gap-3'>
          <span className='bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-md'>
            <MapPin className='h-5 w-5' />
          </span>
          <div className='min-w-0'>
            <p className='text-foreground text-sm font-semibold'>
              {events[0]?.location || 'Location pending'}
            </p>
            <p className='text-muted-foreground text-xs'>
              {instructors.length} instructor{instructors.length === 1 ? '' : 's'} visible
            </p>
          </div>
        </div>
      </section>

      <section className='bg-card rounded-md border p-3 shadow-sm'>
        <div className='mb-2 flex items-center justify-between'>
          <h2 className='text-foreground text-sm font-semibold'>Share</h2>
          <Button size='sm' variant='ghost' className='h-7 px-2 text-xs'>
            <Copy className='h-3.5 w-3.5' />
            Copy
          </Button>
        </div>
        <div className='flex gap-2'>
          <Input value='https://elimika.com/schedule' readOnly className='h-9 text-xs' />
          <Button variant='secondary' size='sm' className='h-9 rounded px-3 text-xs'>
            Copy
          </Button>
        </div>
      </section>

      <section className='bg-card rounded-md border p-3 shadow-sm'>
        <div className='mb-2 flex items-center justify-between'>
          <h2 className='text-foreground text-sm font-semibold'>To Do List</h2>
          <Button variant='ghost' size='sm' className='h-7 px-2 text-xs'>
            Add Mate
          </Button>
        </div>
        <div className='space-y-2'>
          {[
            'Enable room booking notification system',
            'Schedule lab equipment for Robotics class',
          ].map(item => (
            <label key={item} className='bg-muted/40 flex items-start gap-2 rounded-md p-2 text-xs'>
              <Checkbox />
              <span className='text-muted-foreground'>{item}</span>
            </label>
          ))}
        </div>
      </section>

      <section className='bg-card rounded-md border p-3 shadow-sm'>
        <div className='mb-2 flex items-center justify-between'>
          <h2 className='text-foreground text-sm font-semibold'>Notes</h2>
          <Button variant='ghost' size='sm' className='h-7 px-2 text-xs'>
            Add Note
          </Button>
        </div>
        <p className='bg-muted/40 text-muted-foreground rounded-md p-2 text-xs'>
          Large classroom changes need projector and export coordination.
        </p>
      </section>
    </aside>
  );
}
