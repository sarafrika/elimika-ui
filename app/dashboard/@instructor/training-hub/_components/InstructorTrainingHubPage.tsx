'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../../../../../components/ui/button';
import { BookingCard } from './BookingCard';
import { LiveClassCard } from './LiveClassCard';
import { TrainingHubSectionHeader } from './TrainingHubSectionHeader';
import { TrainingHubToolbar } from './TrainingHubToolbar';
import { WaitingListItem } from './WaitingListItem';
import { useInstructorTrainingHubData } from './useInstructorTrainingHubData';

function getLiveClassCompletionRate(liveClass: {
  class?: {
    class_progress_percentage?: number | null;
    scheduled_session_count?: number | null;
    completed_session_count?: number | null;
    schedule?: Array<{
      status?: string | null;
      concluded_at?: string | null;
      start_time?: string | null;
      end_time?: string | null;
    }>;
  } | null;
}) {
  const progress = liveClass.class?.class_progress_percentage;
  if (typeof progress === 'number' && !Number.isNaN(progress)) {
    return Math.max(0, Math.min(100, Math.round(progress)));
  }

  const schedule = liveClass.class?.schedule ?? [];
  const countableSessions = schedule.filter(instance => {
    const status = instance.status?.toUpperCase();
    return status !== 'CANCELLED' && status !== 'BLOCKED';
  });

  const totalSessions =
    typeof liveClass.class?.scheduled_session_count === 'number'
      ? liveClass.class.scheduled_session_count
      : countableSessions.length;
  const completedSessions =
    typeof liveClass.class?.completed_session_count === 'number'
      ? liveClass.class.completed_session_count
      : countableSessions.filter(
        instance =>
          instance.status?.toUpperCase() === 'COMPLETED' || Boolean(instance.concluded_at)
      ).length;

  return totalSessions ? Math.round((completedSessions / totalSessions) * 100) : 0;
}

function getScheduledClassInstances(liveClass: {
  class?: {
    schedule?: Array<{
      start_time?: string | Date | null;
      status?: string | null;
    }>;
  } | null;
}) {
  return (liveClass.class?.schedule ?? []).filter(instance => {
    const status = instance.status?.toUpperCase();
    return status !== 'CANCELLED' && status !== 'BLOCKED';
  });
}

function isSameCalendarDay(left?: string | Date | null, right: Date = new Date()) {
  if (!left) return false;

  const leftDate = new Date(left);
  if (Number.isNaN(leftDate.getTime())) return false;

  return (
    leftDate.getFullYear() === right.getFullYear() &&
    leftDate.getMonth() === right.getMonth() &&
    leftDate.getDate() === right.getDate()
  );
}

function isTomorrow(left?: string | Date | null) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameCalendarDay(left, tomorrow);
}

function isUpcomingClass(liveClass: {
  class?: {
    schedule?: Array<{
      start_time?: string | Date | null;
      status?: string | null;
    }>;
  } | null;
}) {
  const now = Date.now();

  return getScheduledClassInstances(liveClass).some(instance => {
    if (!instance.start_time) return false;
    const startTime = new Date(instance.start_time).getTime();
    return Number.isFinite(startTime) && startTime > now;
  });
}

function matchesClassTag(
  liveClass: { title?: string; provider?: string; level?: string },
  tag: string
) {
  const haystack = `${liveClass.title ?? ''} ${liveClass.provider ?? ''} ${liveClass.level ?? ''}`.toLowerCase();
  return haystack.includes(tag);
}

export function InstructorTrainingHubPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<
    'all' | 'today' | 'upcoming' | 'incomplete' | 'remedial' | 'make-up' | 'cancelled' | 'completed'
  >('all');

  const {
    liveClasses,
    upcomingBookings,
    waitingList,
    isLoading,
  } = useInstructorTrainingHubData();

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredLiveClasses = useMemo(
    () =>
      liveClasses
        .filter(liveClass => {
          const searchMatch = [
            liveClass.title,
            liveClass.provider,
            liveClass.level,
            liveClass.classes,
            liveClass.students,
            ...(liveClass.programCourses ?? []).flatMap(course => [
              course.name,
              course.description ?? '',
              course.difficulty_uuid ?? '',
            ]),
          ].some(value => value.toLowerCase().includes(normalizedSearch));

          if (!searchMatch) return false;

          const completionRate = getLiveClassCompletionRate(liveClass);

          const hasTodaySession = getScheduledClassInstances(liveClass).some(instance =>
            isSameCalendarDay(instance.start_time)
          );

          const hasTomorrowSession = getScheduledClassInstances(liveClass).some(instance =>
            isTomorrow(instance.start_time)
          );

          const hasFutureSession = isUpcomingClass(liveClass);

          const isCancelled =
            (liveClass.class?.schedule ?? []).length > 0 &&
            (liveClass.class?.schedule ?? []).every(instance => {
              const status = instance.status?.toUpperCase();
              return status === 'CANCELLED' || status === 'BLOCKED';
            });

          const isIncomplete = completionRate > 0 && completionRate < 100;
          const isCompleted = completionRate === 100;

          const isRemedial = matchesClassTag(liveClass, 'remedial');

          const isMakeUp =
            matchesClassTag(liveClass, 'make-up') ||
            matchesClassTag(liveClass, 'makeup');

          const typeMatch =
            selectedType === 'all' ||
            (selectedType === 'today' && hasTodaySession) ||
            (selectedType === 'upcoming' && hasFutureSession) ||
            (selectedType === 'incomplete' && isIncomplete) ||
            (selectedType === 'remedial' && isRemedial) ||
            (selectedType === 'make-up' && isMakeUp) ||
            (selectedType === 'cancelled' && isCancelled) ||
            (selectedType === 'completed' && isCompleted);

          return typeMatch;
        })
        .sort(
          (a, b) =>
            new Date(b.class?.created_date).getTime() -
            new Date(a.class?.created_date).getTime()
        ),
    [liveClasses, normalizedSearch, selectedType]
  );

  const filteredWaitingList = useMemo(
    () =>
      waitingList.filter(student =>
        [student.name, student.email, student.classTitle].some(value =>
          value.toLowerCase().includes(normalizedSearch)
        )
      ),
    [normalizedSearch, waitingList]
  );

  const filteredBookings = useMemo(
    () =>
      upcomingBookings.filter(booking =>
        [booking.title, booking.subtitle, booking.status, booking.meta].some(value =>
          value.toLowerCase().includes(normalizedSearch)
        )
      ),
    [normalizedSearch, upcomingBookings]
  );

  return (
    <main className='mx-auto flex w-full flex-col gap-4 bg-background px-3 py-3 sm:px-4 sm:py-4 lg:px-5'>
      <TrainingHubToolbar
        onSearchTermChange={setSearchTerm}
        onTypeChange={setSelectedType}
        searchTerm={searchTerm}
        selectedType={selectedType}
      />

      <section className='grid w-full min-w-0 max-w-full gap-4 overflow-hidden xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]'>
        <div className='min-w-0 space-y-3 overflow-hidden'>
          <TrainingHubSectionHeader
            actionLabel={``}
            href='/dashboard/classes'
            title='My Classes'
          />

          <div className='space-y-3'>
            {filteredLiveClasses.map(liveClass => (
              <LiveClassCard key={liveClass.id} liveClass={liveClass} />
            ))}

            {!isLoading && filteredLiveClasses.length === 0 && (
              <Card className='border-border/60 shadow-sm'>
                <CardContent className='py-10 text-center text-sm text-muted-foreground'>
                  No created classes matched your search.
                </CardContent>
              </Card>
            )}

            {isLoading && (
              <Card className='border-border/60 shadow-sm'>
                <CardContent className='py-10 text-center text-sm text-muted-foreground'>
                  Loading classes...
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <aside className='min-w-0 space-y-5 overflow-hidden'>
          <section className='space-y-3'>
            <TrainingHubSectionHeader
              actionLabel={`Show All (${waitingList.length})`}
              href='/dashboard/training-hub/waiting-list'
              title='Waiting List'
            />

            {filteredWaitingList.length > 0 ? (
              <div className='space-y-3'>
                {filteredWaitingList.slice(0, 3).map(student => (
                  <WaitingListItem key={student.id} student={student} />
                ))}
              </div>
            ) : (
              <div className='mx-auto flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center'>
                <p className='text-sm font-medium text-foreground'>No students on the waiting list</p>

                <p className='mt-1 text-sm text-muted-foreground'>
                  New waiting list requests will appear here.
                </p>
              </div>
            )}
          </section>

          <section className='space-y-3'>
            <TrainingHubSectionHeader
              actionLabel={`Show All (${upcomingBookings.length})`}
              href='/dashboard/training-hub/bookings'
              title='Bookings'
            />

            {filteredBookings.length > 0 ? (
              <div className='space-y-3'>
                {filteredBookings.slice(0, 3).map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <div className='flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center'>
                <p className='text-sm font-medium text-foreground'>No upcoming bookings</p>

                <p className='mt-1 text-sm text-muted-foreground'>
                  Upcoming bookings will appear here.
                </p>
              </div>
            )}
          </section>

          <Button
            type='button'
            className='flex w-full items-center justify-center gap-3 rounded-[10px] bg-primary px-4 py-3 text-center text-[0.96rem] font-medium text-primary-foreground transition-colors hover:bg-primary/90'
          >
            <CalendarDays className='size-4 shrink-0' />
            <span className='truncate'>Invite Past Students</span>
            <span aria-hidden='true'>›</span>
          </Button>
        </aside>
      </section>
    </main>
  );
}
