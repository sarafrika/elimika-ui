'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cx, getCardClasses, getEmptyStateClasses, getStatCardClasses } from '@/lib/design-system';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isSameMonth,
  isThisMonth,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  User,
  Video,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { CustomLoadingState } from '../../../@course_creator/_components/loading-state';
import { humanizeEnum, type StudentScheduleInstance } from './schedule-data';

type Props = {
  classDefinitions: any[];
  scheduleInstances: StudentScheduleInstance[];
  loading?: boolean;
};

function openMeetingLink(url?: string) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function TimetableManager({ classDefinitions, loading, scheduleInstances }: Props) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'agenda'>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<StudentScheduleInstance | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    let cursor = calendarStart;

    while (cursor <= calendarEnd) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }

    return days;
  }, [calendarEnd, calendarStart]);

  const selectedDaySchedules = useMemo(
    () =>
      scheduleInstances.filter(instance => isSameDay(new Date(instance.startTime), selectedDate)),
    [scheduleInstances, selectedDate]
  );

  const upcomingSchedules = useMemo(
    () =>
      scheduleInstances
        .filter(instance => isAfter(new Date(instance.endTime), subDays(new Date(), 1)))
        .slice(0, 8),
    [scheduleInstances]
  );

  const activeClasses = classDefinitions.filter(
    (classRecord: any) => (classRecord.schedules?.length ?? 0) > 0
  ).length;

  if (loading) {
    return <CustomLoadingState subHeading='Loading your timetable...' />;
  }

  if (!scheduleInstances.length) {
    return (
      <section className={getEmptyStateClasses()}>
        <Calendar className='text-primary/70 mb-2 h-12 w-12' />
        <h3 className='text-foreground text-lg font-semibold'>No timetable entries yet</h3>
        <p className='text-muted-foreground max-w-md text-sm'>
          Your class schedule instances will appear here once sessions are created for the classes
          you are enrolled in.
        </p>
      </section>
    );
  }

  return (
    <div className='space-y-6'>
      <section className='grid gap-4 xl:grid-cols-[1.15fr_0.85fr]'>
        <div className='grid gap-4 sm:grid-cols-3'>
          {[
            {
              label: 'Classes on timetable',
              value: activeClasses,
              helper: 'Enrolled classes with schedule instances',
              icon: User,
            },
            {
              label: 'Sessions in range',
              value: scheduleInstances.length,
              helper: 'Visible schedule instances',
              icon: Calendar,
            },
            {
              label: 'Selected day',
              value: selectedDaySchedules.length,
              helper: format(selectedDate, 'EEEE, MMM d'),
              icon: Clock,
            },
          ].map(metric => (
            <div key={metric.label} className={getStatCardClasses()}>
              <div className='flex items-start gap-4'>
                <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                  <metric.icon className='h-5 w-5' />
                </div>
                <div>
                  <p className='text-muted-foreground text-sm'>{metric.label}</p>
                  <p className='text-foreground text-2xl font-semibold'>{metric.value}</p>
                  <p className='text-muted-foreground text-xs'>{metric.helper}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={cx(getCardClasses(), 'p-5 sm:p-6')}>
          <div className='space-y-3'>
            <h2 className='text-foreground text-xl font-semibold'>Upcoming sessions</h2>
            <p className='text-muted-foreground text-sm'>
              Quick access to the next class meetings in your current timetable range.
            </p>
            <div className='space-y-3'>
              {upcomingSchedules.map(schedule => (
                <button
                  key={schedule.uuid}
                  type='button'
                  onClick={() => {
                    setSelectedDate(new Date(schedule.startTime));
                    setSelectedSchedule(schedule);
                  }}
                  className='border-border/60 bg-muted/30 hover:border-primary/30 hover:bg-primary/5 w-full rounded-2xl border p-4 text-left transition'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <p className='text-foreground truncate font-medium'>{schedule.classTitle}</p>
                      <p className='text-muted-foreground mt-1 text-sm'>
                        {format(new Date(schedule.startTime), 'EEE, MMM d')} · {schedule.timeRange}
                      </p>
                      <p className='text-muted-foreground mt-1 text-sm'>{schedule.locationLabel}</p>
                    </div>
                    <Badge variant='outline'>
                      {schedule.meetingUrl ? 'Launch ready' : 'Details'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={cx(getCardClasses(), 'p-4 sm:p-6')}>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              size='icon'
              onClick={() => setCurrentMonth(addDays(monthStart, -1))}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <div>
              <h2 className='text-foreground text-xl font-semibold'>
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <p className='text-muted-foreground text-sm'>
                Click a day or session card to inspect that schedule instance.
              </p>
            </div>
            <Button
              variant='outline'
              size='icon'
              onClick={() => setCurrentMonth(addDays(monthEnd, 1))}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>

          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <Tabs value={view} onValueChange={value => setView(value as 'calendar' | 'agenda')}>
              <TabsList className='grid w-full grid-cols-2 sm:w-[240px]'>
                <TabsTrigger value='calendar'>Calendar</TabsTrigger>
                <TabsTrigger value='agenda'>Agenda</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant='outline' onClick={() => setCurrentMonth(new Date())}>
              This month
            </Button>
          </div>
        </div>

        {view === 'calendar' ? (
          <div className='mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
            <div className='border-border/60 overflow-hidden rounded-3xl border'>
              <div className='border-border/60 bg-muted/30 grid grid-cols-7 border-b'>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div
                    key={day}
                    className='text-muted-foreground p-3 text-center text-xs font-semibold tracking-[0.2em] uppercase'
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className='bg-border/60 grid grid-cols-7 gap-px'>
                {calendarDays.map(day => {
                  const daySchedules = scheduleInstances.filter(instance =>
                    isSameDay(new Date(instance.startTime), day)
                  );
                  const isSelected = isSameDay(day, selectedDate);

                  return (
                    <button
                      key={day.toISOString()}
                      type='button'
                      onClick={() => setSelectedDate(day)}
                      className={cx(
                        'bg-background hover:bg-muted/20 min-h-[132px] p-2 text-left transition sm:min-h-[156px] sm:p-3',
                        !isSameMonth(day, currentMonth) && 'bg-muted/20 text-muted-foreground',
                        isSelected && 'ring-primary ring-2 ring-inset',
                        isThisMonth(day) && 'bg-primary/5 dark:bg-background'
                      )}
                    >
                      <div className='flex items-center justify-between gap-2'>
                        <span
                          className={cx(
                            'inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                            isSelected && 'bg-primary text-primary-foreground'
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                        {daySchedules.length > 0 && (
                          <Badge variant='secondary'>{daySchedules.length}</Badge>
                        )}
                      </div>

                      <div className='mt-3 space-y-2'>
                        {daySchedules.slice(0, 2).map(schedule => (
                          <div
                            key={schedule.uuid}
                            className='border-primary/15 bg-primary/5 rounded-2xl border px-2 py-1.5 text-xs'
                          >
                            <p className='text-foreground truncate font-medium'>
                              {schedule.classTitle}
                            </p>
                            <p className='text-muted-foreground truncate'>{schedule.timeRange}</p>
                          </div>
                        ))}
                        {daySchedules.length > 2 && (
                          <p className='text-muted-foreground text-xs'>
                            +{daySchedules.length - 2} more
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className='space-y-4'>
              <div className='border-border/60 bg-muted/20 rounded-3xl border p-4'>
                <p className='text-muted-foreground text-sm'>Selected day</p>
                <h3 className='text-foreground mt-1 text-xl font-semibold'>
                  {format(selectedDate, 'EEEE, MMMM d')}
                </h3>
                <p className='text-muted-foreground mt-1 text-sm'>
                  {selectedDaySchedules.length} schedule instance
                  {selectedDaySchedules.length === 1 ? '' : 's'}
                </p>
              </div>

              <ScrollArea className='border-border/60 h-[420px] rounded-3xl border'>
                <div className='space-y-3 p-3'>
                  {selectedDaySchedules.length > 0 ? (
                    selectedDaySchedules.map(schedule => (
                      <button
                        key={schedule.uuid}
                        type='button'
                        onClick={() => setSelectedSchedule(schedule)}
                        className='border-border/60 bg-background hover:border-primary/30 hover:bg-primary/5 w-full rounded-2xl border p-4 text-left transition'
                      >
                        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                          <div className='min-w-0'>
                            <p className='text-foreground truncate text-base font-semibold'>
                              {schedule.classTitle}
                            </p>
                            <p className='text-muted-foreground mt-1 text-sm'>
                              {schedule.timeRange}
                            </p>
                            <p className='text-muted-foreground mt-1 text-sm'>
                              {schedule.locationLabel}
                            </p>
                          </div>
                          <Badge variant='outline'>
                            {schedule.meetingUrl
                              ? 'Open details'
                              : humanizeEnum(schedule.locationType)}
                          </Badge>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className='border-border/60 text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm'>
                      No class sessions scheduled for this day.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        ) : (
          <div className='mt-6 space-y-3'>
            {scheduleInstances.map(schedule => (
              <div
                key={schedule.uuid}
                className='border-border/60 bg-background hover:border-primary/30 hover:bg-primary/5 rounded-3xl border p-4 transition'
              >
                <div className='grid gap-4 lg:grid-cols-[1.4fr_0.9fr_0.7fr] lg:items-center'>
                  <div className='min-w-0'>
                    <p className='text-foreground truncate text-base font-semibold'>
                      {schedule.classTitle}
                    </p>
                    <p className='text-muted-foreground mt-1 text-sm'>
                      {schedule.courseName || schedule.classSubtitle || 'Class session'}
                    </p>
                  </div>
                  <div className='text-muted-foreground space-y-1 text-sm'>
                    <p>{format(new Date(schedule.startTime), 'EEEE, MMMM d')}</p>
                    <p>{schedule.timeRange}</p>
                  </div>
                  <div className='flex items-center justify-between gap-3 lg:justify-end'>
                    <Badge variant='outline'>{schedule.locationLabel}</Badge>
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setSelectedSchedule(schedule)}
                      >
                        Details
                      </Button>
                      {schedule.meetingUrl && (
                        <Button size='sm' onClick={() => openMeetingLink(schedule.meetingUrl)}>
                          Open
                          <ExternalLink className='ml-2 h-3.5 w-3.5' />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={!!selectedSchedule} onOpenChange={open => !open && setSelectedSchedule(null)}>
        <DialogContent className='max-w-[96vw] sm:max-w-2xl'>
          {selectedSchedule && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSchedule.classTitle}</DialogTitle>
                <DialogDescription>
                  {selectedSchedule.courseName || 'Scheduled class instance'}
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4'>
                <div className='flex flex-wrap gap-2'>
                  <Badge variant='outline'>{selectedSchedule.status || 'Scheduled'}</Badge>
                  <Badge variant='secondary'>{selectedSchedule.durationFormatted}</Badge>
                  <Badge variant='secondary'>
                    {humanizeEnum(selectedSchedule.locationType) || 'Classroom'}
                  </Badge>
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='border-border/60 bg-muted/20 rounded-2xl border p-4'>
                    <div className='flex items-start gap-3'>
                      <Calendar className='text-primary mt-0.5 h-5 w-5' />
                      <div>
                        <p className='text-foreground font-medium'>Date</p>
                        <p className='text-muted-foreground text-sm'>
                          {format(new Date(selectedSchedule.startTime), 'EEEE, MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='border-border/60 bg-muted/20 rounded-2xl border p-4'>
                    <div className='flex items-start gap-3'>
                      <Clock className='text-primary mt-0.5 h-5 w-5' />
                      <div>
                        <p className='text-foreground font-medium'>Time</p>
                        <p className='text-muted-foreground text-sm'>
                          {selectedSchedule.timeRange}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='border-border/60 bg-muted/20 rounded-2xl border p-4'>
                    <div className='flex items-start gap-3'>
                      {selectedSchedule.locationType === 'ONLINE' ? (
                        <Video className='text-primary mt-0.5 h-5 w-5' />
                      ) : (
                        <MapPin className='text-primary mt-0.5 h-5 w-5' />
                      )}
                      <div>
                        <p className='text-foreground font-medium'>Classroom</p>
                        <p className='text-muted-foreground text-sm'>
                          {selectedSchedule.locationLabel}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='border-border/60 bg-muted/20 rounded-2xl border p-4'>
                    <div className='flex items-start gap-3'>
                      <User className='text-primary mt-0.5 h-5 w-5' />
                      <div>
                        <p className='text-foreground font-medium'>Instructor</p>
                        <p className='text-muted-foreground text-sm'>
                          {selectedSchedule.instructorName || 'Instructor details unavailable'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='flex flex-col gap-3 sm:flex-row'>
                  <Button
                    className='flex-1'
                    variant={selectedSchedule.meetingUrl ? 'default' : 'outline'}
                    disabled={!selectedSchedule.meetingUrl}
                    onClick={() => openMeetingLink(selectedSchedule.meetingUrl)}
                  >
                    {selectedSchedule.meetingUrl
                      ? 'Launch class meeting'
                      : 'Meeting link unavailable'}
                    <ExternalLink className='ml-2 h-4 w-4' />
                  </Button>
                  <Button
                    className='flex-1'
                    variant='outline'
                    onClick={() => {
                      setSelectedSchedule(null);
                      router.push(selectedSchedule.classHref);
                    }}
                  >
                    Open class page
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
