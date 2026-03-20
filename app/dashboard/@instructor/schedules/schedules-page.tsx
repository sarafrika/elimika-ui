'use client';

import {
  ClassScheduleManager,
  type ManagedScheduleItem,
} from '@/components/instructor/ClassScheduleManager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as DateCalendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import { cx, elimikaDesignSystem, getHeaderClasses, getStatCardClasses } from '@/lib/design-system';
import {
  CalendarDays,
  Clock3,
  Filter,
  Layers3,
  MapPin,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import moment from 'moment';
import { useEffect, useMemo, useState } from 'react';

const ALL_CLASSES = 'all-classes';

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export default function InstructorSchedulePage() {
  const instructor = useInstructor();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClassId, setSelectedClassId] = useState<string>(ALL_CLASSES);
  const [searchQuery, setSearchQuery] = useState('');

  const { classes, isLoading, isPending } = useInstructorClassesWithSchedules(instructor?.uuid);

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'schedules', title: 'Schedules', url: '/dashboard/schedules', isLast: true },
    ]);
  }, [replaceBreadcrumbs]);

  const allSchedules = useMemo<ManagedScheduleItem[]>(
    () =>
      classes.flatMap(classItem =>
        (classItem.schedule ?? []).map((schedule: any) => ({
          uuid: schedule.uuid,
          classId: classItem.uuid,
          classTitle: classItem.title || 'Untitled class',
          courseName: classItem.course?.name,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          duration_formatted: schedule.duration_formatted ?? classItem.duration_formatted,
          location_name: classItem.location_name,
          location_type: classItem.location_type,
          session_format: classItem.session_format,
          meeting_url: schedule.meeting_url ?? classItem.meeting_link,
          status: schedule.status,
        }))
      ),
    [classes]
  );

  const classOptions = useMemo(
    () =>
      classes
        .map(classItem => ({ id: classItem.uuid, label: classItem.title || 'Untitled class' }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [classes]
  );

  const filteredSchedules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allSchedules.filter(schedule => {
      if (selectedClassId !== ALL_CLASSES && schedule.classId !== selectedClassId) {
        return false;
      }

      const scheduleDate = new Date(schedule.start_time);
      if (!isSameDay(scheduleDate, selectedDate)) {
        return false;
      }

      if (!query) return true;

      return [schedule.classTitle, schedule.courseName, schedule.location_name]
        .filter(Boolean)
        .some(value => value?.toLowerCase().includes(query));
    });
  }, [allSchedules, searchQuery, selectedClassId, selectedDate]);

  const selectedMonthSchedules = useMemo(() => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();

    return allSchedules.filter(schedule => {
      const date = new Date(schedule.start_time);
      if (selectedClassId !== ALL_CLASSES && schedule.classId !== selectedClassId) {
        return false;
      }
      return date.getMonth() === month && date.getFullYear() === year;
    });
  }, [allSchedules, selectedClassId, selectedDate]);

  const selectedClass = useMemo(
    () => classes.find(classItem => classItem.uuid === selectedClassId),
    [classes, selectedClassId]
  );

  const stats = useMemo(() => {
    const totalSessions = allSchedules.length;
    const upcoming = allSchedules.filter(schedule =>
      moment(schedule.start_time).isAfter(moment())
    ).length;
    const todaysSessions = allSchedules.filter(schedule =>
      isSameDay(new Date(schedule.start_time), selectedDate)
    ).length;

    return {
      totalSessions,
      upcoming,
      todaysSessions,
      uniqueCourses: new Set(allSchedules.map(schedule => schedule.classId)).size,
    };
  }, [allSchedules, selectedDate]);

  const highlightedDays = useMemo(
    () => selectedMonthSchedules.map(schedule => new Date(schedule.start_time)),
    [selectedMonthSchedules]
  );

  const upcomingPreview = useMemo(
    () =>
      [...allSchedules]
        .filter(schedule => moment(schedule.start_time).isSameOrAfter(moment()))
        .sort((a, b) => moment(a.start_time).diff(moment(b.start_time)))
        .slice(0, 4),
    [allSchedules]
  );

  // if (isLoading || isPending) {
  //   return (/
  //     <div className='space-y-6 p-2 sm:p-6 lg:p-10'>
  //       <Skeleton className='h-56 w-full rounded-[36px]' />
  //       <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
  //         <Skeleton className='h-32 w-full rounded-[28px]' />
  //         <Skeleton className='h-32 w-full rounded-[28px]' />
  //         <Skeleton className='h-32 w-full rounded-[28px]' />
  //         <Skeleton className='h-32 w-full rounded-[28px]' />
  //       </div>
  //       <div className='grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]'>
  //         <Skeleton className='h-[520px] w-full rounded-[28px]' />
  //         <Skeleton className='h-[520px] w-full rounded-[28px]' />
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <main className={elimikaDesignSystem.components.pageContainer}>
      <section className={cx(getHeaderClasses(), 'relative overflow-hidden')}>
        <div className='dark:hidden pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,97,237,0.14),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(0,97,237,0.12),transparent_35%)]' />
        <div className='relative space-y-6'>
          <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
            <div className='space-y-4'>
              <Badge className={elimikaDesignSystem.components.header.badge}>Instructor schedules</Badge>
              <div className='space-y-3'>
                <h1 className={elimikaDesignSystem.components.header.title}>
                  Calendar-driven class management
                </h1>
                <p className={elimikaDesignSystem.components.header.subtitle}>
                  Review every teaching slot on a responsive calendar, then manage attendance,
                  assignments, quizzes, and live class launch directly from the day agenda.
                </p>
              </div>
            </div>

            <Card className='w-full max-w-md rounded-[32px] border-primary/20 bg-primary/5 shadow-none'>
              <CardContent className='space-y-3 p-6'>
                <div className='flex items-center gap-2 text-primary'>
                  <Sparkles className='h-4 w-4' />
                  <span className='text-sm font-semibold'>Today&apos;s focus</span>
                </div>
                <p className='text-2xl font-semibold text-foreground'>
                  {filteredSchedules.length} session{filteredSchedules.length === 1 ? '' : 's'}
                </p>
                <p className='text-sm text-muted-foreground'>
                  {moment(selectedDate).format('dddd, MMMM D')} agenda currently loaded for direct
                  class operations.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-2xl bg-primary/10 p-3 text-primary'>
                    <CalendarDays className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>All sessions</p>
                    <p className='text-2xl font-semibold text-foreground'>{stats.totalSessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-2xl bg-primary/10 p-3 text-primary'>
                    <Clock3 className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>Upcoming</p>
                    <p className='text-2xl font-semibold text-foreground'>{stats.upcoming}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-2xl bg-primary/10 p-3 text-primary'>
                    <Layers3 className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>Classes</p>
                    <p className='text-2xl font-semibold text-foreground'>{stats.uniqueCourses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-2xl bg-primary/10 p-3 text-primary'>
                    <Users className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>Selected day</p>
                    <p className='text-2xl font-semibold text-foreground'>{stats.todaysSessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className='grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]'>
        <Card className='overflow-hidden rounded-[32px] border-border/60 bg-card/95'>
          <CardContent className='space-y-6 p-5 sm:p-6'>
            <div className='space-y-1'>
              <Badge variant='outline' className='border-primary/30 bg-primary/5 text-primary'>
                Filters
              </Badge>
              <h2 className='text-xl font-semibold text-foreground'>Pick a date and class</h2>
              <p className='text-sm text-muted-foreground'>
                The day agenda updates immediately and keeps session actions available across mobile
                and desktop layouts.
              </p>
            </div>

            <div className='grid gap-3'>
              <div className='relative'>
                <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder='Search class, course, or venue'
                  className='pl-9'
                />
              </div>

              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder='Filter by class' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CLASSES}>All classes</SelectItem>
                  {classOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant='outline'
                className='justify-start gap-2'
                onClick={() => {
                  setSelectedClassId(ALL_CLASSES);
                  setSearchQuery('');
                  setSelectedDate(new Date());
                }}
              >
                <Filter className='h-4 w-4' />
                Reset filters
              </Button>
            </div>

            <div className='rounded-[28px] border border-border/60 bg-background/70 p-3'>
              <DateCalendar
                mode='single'
                selected={selectedDate}
                onSelect={date => date && setSelectedDate(date)}
                modifiers={{ scheduled: highlightedDays }}
                modifiersClassNames={{
                  scheduled: 'bg-primary/10 text-primary font-semibold',
                }}
                className='mx-auto'
              />
            </div>

            <div className='space-y-3 rounded-[28px] border border-border/60 bg-background/70 p-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold text-foreground'>Upcoming preview</h3>
                <Badge variant='secondary'>{upcomingPreview.length}</Badge>
              </div>

              {upcomingPreview.length === 0 ? (
                <p className='text-sm text-muted-foreground'>No upcoming sessions available.</p>
              ) : (
                <div className='space-y-3'>
                  {upcomingPreview.map(schedule => (
                    <button
                      key={schedule.uuid}
                      type='button'
                      className='w-full rounded-[24px] border border-border/60 bg-card/80 p-3 text-left transition hover:border-primary/40 hover:bg-primary/5'
                      onClick={() => setSelectedDate(new Date(schedule.start_time))}
                    >
                      <p className='font-medium text-foreground'>{schedule.classTitle}</p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {moment(schedule.start_time).format('ddd, MMM D · h:mm A')}
                      </p>
                      <p className='mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground'>
                        <MapPin className='h-3.5 w-3.5' />
                        {schedule.location_name || schedule.location_type || 'Location pending'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className='space-y-6'>
          <div className='space-y-2'>
            <Badge variant='outline' className='w-fit border-primary/30 bg-primary/5 text-primary'>
              Day agenda
            </Badge>
            <h2 className='text-2xl font-semibold text-foreground'>
              {moment(selectedDate).format('dddd, MMMM D')}
            </h2>
            <p className='text-sm text-muted-foreground'>
              {selectedClass
                ? `Showing sessions for ${selectedClass.title}.`
                : 'Showing sessions for all instructor classes.'}
            </p>
          </div>

          <ClassScheduleManager
            schedules={filteredSchedules}
            fixedClassId={filteredSchedules.length === 1 ? filteredSchedules[0].classId : undefined}
            groupBy='day'
            title='Class schedule instances'
            description='Launch live classes and manage attendance, assignments, and quizzes from the selected day.'
            emptyTitle='No sessions on this date'
            emptyDescription='Try another date or remove class filters to load more schedule instances.'
          />
        </div>
      </section>
    </main>
  );
}
