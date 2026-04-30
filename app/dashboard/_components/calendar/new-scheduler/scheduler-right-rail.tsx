'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Copy, ExternalLink, MapPin, Share2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { studentMetric } from './data';
import type { SchedulerEvent } from './types';

type InstructorSummary = {
  uuid: string;
  fullName: string;
  avatarUrl?: string;
  subtitle?: string;
};

type StudentSummary = {
  uuid: string;
  fullName: string;
  avatarUrl?: string;
};

type LocationSummary = {
  label: string;
  detail: string;
  meetingLink?: string;
};

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

function makeInitials(value?: string) {
  return (
    value
      ?.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'NA'
  );
}

export function SchedulerRightRail({
  currentDate,
  events,
  instructors,
  allInstructors,
  students,
  locations,
  showAllInstructors,
  onToggleInstructors,
}: {
  currentDate: Date;
  events: SchedulerEvent[];
  instructors: InstructorSummary[];
  allInstructors: InstructorSummary[];
  students: StudentSummary[];
  locations: LocationSummary[];
  showAllInstructors: boolean;
  onToggleInstructors: () => void;
}) {
  const [shareFeedback, setShareFeedback] = useState<'idle' | 'copied'>('idle');

  const dayEvents = useMemo(
    () =>
      events
        .filter(event => isSameCalendarDay(event.startTime, currentDate))
        .sort((left, right) => left.startTime.getTime() - right.startTime.getTime()),
    [currentDate, events]
  );

  const visibleSchedule = dayEvents.slice(0, 5);
  const visibleInstructors = showAllInstructors ? allInstructors : instructors;
  const visibleStudents = students.slice(0, 24);
  const visibleSeats =
    dayEvents.reduce((total, event) => total + (event.maxParticipants ?? event.students.length), 0) ||
    Number(studentMetric.value);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyShareLink = async () => {
    if (!shareUrl) return;

    await navigator.clipboard.writeText(shareUrl);
    setShareFeedback('copied');
    window.setTimeout(() => setShareFeedback('idle'), 1800);
  };

  const openShareLink = async () => {
    if (!shareUrl) return;

    if (navigator.share) {
      await navigator.share({
        title: document.title,
        url: shareUrl,
      });
      return;
    }

    await copyShareLink();
  };

  return (
    <aside className='grid min-w-0 gap-3 2xl:w-80 2xl:shrink-0'>
      <section className='bg-card rounded-md border p-3 shadow-sm'>
        <div className='mb-3 flex items-center justify-between gap-3'>
          <h2 className='text-foreground truncate text-sm font-semibold sm:text-base'>
            Day schedule
          </h2>
          <span className='text-muted-foreground shrink-0 text-xs'>
            {visibleSchedule.length} sessions
          </span>
        </div>

        <div className='space-y-2'>
          {visibleSchedule.length ? (
            visibleSchedule.map(event => (
              <div
                key={event.id}
                className='grid grid-cols-[50px_minmax(0,1fr)_auto] items-start gap-2'
              >
                <span className='text-foreground shrink-0 text-[10px] font-semibold whitespace-nowrap'>
                  {formatTime(event.startTime)}
                </span>

                <div className='min-w-0 overflow-hidden'>
                  <p className='text-muted-foreground mb-1 truncate text-[11px] font-bold'>
                    {event.course}
                  </p>
                  <p className='text-foreground truncate text-xs font-semibold'>{event.title}</p>

                  <p className='text-muted-foreground truncate text-[11px]'>
                    {event.instructor} · {event.location}
                  </p>
                </div>

                <Button
                  size='sm'
                  variant='secondary'
                  className='h-7 shrink-0 rounded px-2 text-xs whitespace-nowrap'
                >
                  Start
                </Button>
              </div>
            ))
          ) : (
            <p className='bg-muted/40 text-muted-foreground rounded-md p-3 text-xs'>
              No sessions scheduled for this day.
            </p>
          )}
        </div>
      </section>

      <section className='bg-card rounded-md border p-3 shadow-sm'>
        <div className='mb-2 flex items-center justify-between gap-3'>
          <h2 className='text-foreground text-sm font-semibold'>Instructors</h2>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-xs'>{visibleInstructors.length} shown</span>
            <Button variant='ghost' size='sm' className='h-7 px-2 text-xs' onClick={onToggleInstructors}>
              {showAllInstructors ? 'See today' : 'See all'}
            </Button>
          </div>
        </div>

        <div className='flex gap-2 overflow-x-auto pb-1'>
          {(visibleInstructors.length ? visibleInstructors : [{ uuid: 'placeholder', fullName: 'Instructor pending' }]).map(
            instructor => (
              <div
                key={instructor.uuid}
                className='bg-muted/40 flex min-w-[180px] items-center gap-2 rounded-md p-2'
              >
                <Avatar className='h-8 w-8 border'>
                  <AvatarImage src={instructor.avatarUrl} />
                  <AvatarFallback className='text-[10px]'>
                    {makeInitials(instructor.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0'>
                  <span className='text-foreground block truncate text-xs font-medium'>
                    {instructor.fullName}
                  </span>
                  <span className='text-muted-foreground block truncate text-[10px]'>
                    {instructor.subtitle || 'Attached to today&apos;s classes'}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      <section className='bg-card rounded-md border p-3 shadow-sm'>
        <div className='mb-2 flex items-center justify-between gap-3'>
          <h2 className='text-foreground text-sm font-semibold'>Students</h2>
          <span className='text-muted-foreground text-xs'>{students.length} enrolled</span>
        </div>
        <p className='text-foreground text-sm font-semibold'>{visibleSeats} Seats Visible</p>
        <div className='mt-3 flex items-center gap-2 overflow-x-auto pb-1'>
          {visibleStudents.length ? (
            visibleStudents.map(student => (
              <Avatar key={student.uuid} className='h-8 w-8 shrink-0 border'>
                <AvatarImage src={student.avatarUrl} />
                <AvatarFallback className='text-[10px]'>
                  {makeInitials(student.fullName)}
                </AvatarFallback>
              </Avatar>
            ))
          ) : (
            <p className='text-muted-foreground text-xs'>No students enrolled for this day.</p>
          )}
          {students.length > visibleStudents.length ? (
            <div className='text-muted-foreground flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-[10px]'>
              +{students.length - visibleStudents.length}
            </div>
          ) : null}
        </div>
      </section>

      <section className='bg-card rounded-md border p-3 shadow-sm'>
        <div className='mb-2 flex items-center justify-between'>
          <h2 className='text-foreground text-sm font-semibold'>Locations</h2>
          <Button variant='ghost' size='sm' className='h-7 px-2 text-xs'>
            <MapPin className='h-3.5 w-3.5' />
            Active
          </Button>
        </div>
        <div className='space-y-2'>
          {locations.length ? (
            locations.map(location => (
              <div key={`${location.label}-${location.detail}`} className='bg-muted/40 rounded-md p-2'>
                <p className='text-foreground truncate text-sm font-semibold'>{location.label}</p>
                <div className='flex items-center gap-2'>
                  <p className='text-muted-foreground truncate text-xs'>{location.detail}</p>
                  {location.meetingLink ? (
                    <a
                      href={location.meetingLink}
                      target='_blank'
                      rel='noreferrer'
                      className='text-primary inline-flex items-center gap-1 text-xs font-medium'
                    >
                      Open
                      <ExternalLink className='h-3 w-3' />
                    </a>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className='text-muted-foreground bg-muted/40 rounded-md p-3 text-xs'>
              No active locations or meeting links for the selected day.
            </p>
          )}
        </div>
      </section>

      <section className='bg-card rounded-md border p-3 shadow-sm'>
        <div className='mb-2 flex items-center justify-between'>
          <h2 className='text-foreground text-sm font-semibold'>Share</h2>
          <Button size='sm' variant='ghost' className='h-7 px-2 text-xs' onClick={openShareLink}>
            <Share2 className='h-3.5 w-3.5' />
            Share
          </Button>
        </div>
        <div className='flex gap-2'>
          <Input value={shareUrl} readOnly className='h-9 text-xs' />
          <Button variant='outline' size='icon' className='h-9 w-9 shrink-0' onClick={copyShareLink}>
            <Copy className='h-4 w-4' />
          </Button>
        </div>
        <p className='text-muted-foreground mt-2 text-[11px]'>
          {shareFeedback === 'copied' ? 'Calendar link copied.' : 'Share this calendar page with collaborators.'}
        </p>
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
