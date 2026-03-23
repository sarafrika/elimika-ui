'use client';

import {
  ClassScheduleManager,
  type ManagedScheduleItem,
} from '@/components/instructor/ClassScheduleManager';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { cx, elimikaDesignSystem, getHeaderClasses, getStatCardClasses } from '@/lib/design-system';
import { useClassDetails } from '@/hooks/use-class-details';
import { Calendar, Clock3, MapPin, Users } from 'lucide-react';
import moment from 'moment';
import { useParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';

export default function TrainingInterfacePage() {
  const params = useParams();
  const classId = params?.id as string;
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { data, isLoading } = useClassDetails(classId);

  useEffect(() => {
    if (!classId) return;

    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'trainings', title: 'Training Classes', url: '/dashboard/trainings' },
      {
        id: 'instructor-console',
        title: 'Instructor Console',
        url: `/dashboard/trainings/instructor-console/${classId}`,
        isLast: true,
      },
    ]);
  }, [classId, replaceBreadcrumbs]);

  const classData = data.class;
  const course = data.course;
  const schedules = data.schedule ?? [];
  const enrollments = data.enrollments ?? [];

  const mappedSchedules = useMemo<ManagedScheduleItem[]>(
    () =>
      schedules.map((schedule: any) => ({
        uuid: schedule.uuid,
        classId: classId,
        classTitle: classData?.title || 'Untitled class',
        courseName: course?.name,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        duration_formatted: schedule.duration_formatted ?? classData?.duration_formatted,
        location_name: classData?.location_name,
        location_type: classData?.location_type,
        session_format: classData?.session_format,
        meeting_url: schedule.meeting_url ?? classData?.meeting_link,
        status: schedule.status,
      })),
    [classData, classId, course?.name, schedules]
  );

  const progress = useMemo(() => {
    const completed = schedules.filter((schedule: any) =>
      moment(schedule.end_time).isBefore(moment())
    ).length;
    const total = schedules.length;

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [schedules]);

  const nextSession = useMemo(
    () =>
      schedules
        .filter((schedule: any) => moment(schedule.start_time).isAfter(moment()))
        .sort((a: any, b: any) => moment(a.start_time).diff(moment(b.start_time)))[0],
    [schedules]
  );

  if (isLoading) {
    return (
      <div className='space-y-6 p-2 sm:p-6 lg:p-10'>
        <Skeleton className='h-56 w-full rounded-[36px]' />
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <Skeleton className='h-32 w-full rounded-[28px]' />
          <Skeleton className='h-32 w-full rounded-[28px]' />
          <Skeleton className='h-32 w-full rounded-[28px]' />
          <Skeleton className='h-32 w-full rounded-[28px]' />
        </div>
        <Skeleton className='h-[420px] w-full rounded-[28px]' />
      </div>
    );
  }

  return (
    <main className={elimikaDesignSystem.components.pageContainer}>
      <section className={cx(getHeaderClasses(), 'relative overflow-hidden')}>
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,97,237,0.14),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(0,97,237,0.12),transparent_36%)] dark:hidden' />
        <div className='relative space-y-6'>
          <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
            <div className='space-y-4'>
              <Badge className={elimikaDesignSystem.components.header.badge}>
                Instructor console
              </Badge>
              <div className='space-y-3'>
                <h1 className={elimikaDesignSystem.components.header.title}>
                  {classData?.title || 'Training class'}
                </h1>
                <p className={elimikaDesignSystem.components.header.subtitle}>
                  Manage every session for this class, track attendance, launch live teaching, and
                  attach assignments or quizzes from a single workflow.
                </p>
              </div>
            </div>

            <Card className='border-primary/20 bg-primary/5 w-full max-w-md rounded-[32px] shadow-none'>
              <CardContent className='space-y-3 p-6'>
                <div className='flex items-center justify-between'>
                  <span className='text-foreground text-sm font-medium'>Course progress</span>
                  <span className='text-primary text-sm font-semibold'>{progress.percentage}%</span>
                </div>
                <div className='bg-primary/10 h-2 overflow-hidden rounded-full'>
                  <div
                    className='bg-primary h-full rounded-full'
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <p className='text-muted-foreground text-sm'>
                  {progress.completed} of {progress.total} sessions completed.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                    <Users className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Students</p>
                    <p className='text-foreground text-2xl font-semibold'>{enrollments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                    <Calendar className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Sessions</p>
                    <p className='text-foreground text-2xl font-semibold'>{schedules.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                    <MapPin className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Location</p>
                    <p className='text-foreground text-sm font-semibold'>
                      {classData?.location_name || classData?.location_type || 'Not set'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                    <Clock3 className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Next session</p>
                    <p className='text-foreground text-sm font-semibold'>
                      {nextSession
                        ? moment(nextSession.start_time).format('ddd, MMM D · h:mm A')
                        : 'No upcoming session'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className='space-y-6'>
        <div className='flex flex-col gap-2'>
          <Badge variant='outline' className='border-primary/30 bg-primary/5 text-primary w-fit'>
            Session operations
          </Badge>
          <h2 className='text-foreground text-2xl font-semibold'>Run the class by week</h2>
          <p className='text-muted-foreground max-w-3xl text-sm'>
            Each schedule card exposes the same operational actions: launch virtual class, manage
            attendance, and attach class-specific assignments or quizzes.
          </p>
        </div>

        <ClassScheduleManager
          schedules={mappedSchedules}
          fixedClassId={classId}
          groupBy='week'
          showCollectionActions
          title='Weekly class schedule'
          description='All class schedule instances are grouped into weekly blocks for quick scanning and session management.'
          emptyTitle='No scheduled sessions yet'
          emptyDescription='Schedule instances will appear here once this class has been planned.'
        />
      </section>
    </main>
  );
}
