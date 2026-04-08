'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cx, getCardClasses } from '@/lib/design-system';
import { format, isAfter, isBefore } from 'date-fns';
import { ArrowRight, BookOpen, Calendar, Clock, MapPin, User, Video } from 'lucide-react';
import Link from 'next/link';
import { formatClassroomLabel, getClassData, type StudentClassRecord } from './schedule-data';

interface EnrolledClassCardProps {
  classRecord: StudentClassRecord;
  href: string;
}

const EnrolledClassCard = ({ classRecord, href }: EnrolledClassCardProps) => {
  const classData = getClassData(classRecord);
  const course = classRecord?.course;
  const enrollment = classRecord?.enrollments?.[0];
  const schedules = classRecord?.schedules ?? [];

  const startDate = classData?.default_start_time ? new Date(classData.default_start_time) : null;
  const endDate = classData?.default_end_time ? new Date(classData.default_end_time) : null;
  const now = new Date();

  const getClassStatus = () => {
    if (!startDate || !endDate) return { label: 'Scheduled', variant: 'secondary' as const };
    if (isBefore(now, startDate)) return { label: 'Upcoming', variant: 'default' as const };
    if (isAfter(now, endDate)) return { label: 'Completed', variant: 'secondary' as const };
    return { label: 'In Progress', variant: 'default' as const };
  };

  const status = getClassStatus();

  const progress = (() => {
    if (!startDate || !endDate) return 0;
    if (isBefore(now, startDate)) return 0;
    if (isAfter(now, endDate)) return 100;

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    return Math.max(0, Math.min(100, Math.round((elapsed / totalDuration) * 100)));
  })();

  const nextSchedule = schedules
    .filter(schedule => new Date(schedule.end_time).getTime() >= now.getTime())
    .sort(
      (left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime()
    )[0];

  const locationLabel = formatClassroomLabel({
    locationName: classData?.location_name,
    classroom: classData?.classroom,
    locationType: classData?.location_type,
  });

  return (
    <Card className={cx(getCardClasses(), 'group flex h-full flex-col overflow-hidden p-0')}>
      <div className='from-primary/10 via-primary/5 to-background bg-gradient-to-br p-5 dark:from-transparent dark:via-transparent dark:to-transparent'>
        <div className='flex items-start justify-between gap-3'>
          <div className='space-y-2'>
            <div className='bg-primary/10 text-primary inline-flex rounded-2xl p-3'>
              <BookOpen className='h-5 w-5' />
            </div>
            <div>
              <p className='text-muted-foreground text-xs font-medium tracking-[0.24em] uppercase'>
                {course?.name || 'Enrolled class'}
              </p>
              <h3 className='text-foreground mt-2 line-clamp-2 text-xl font-semibold'>
                {classData?.title || course?.name || 'Untitled Class'}
              </h3>
              {classData?.subtitle && (
                <p className='text-muted-foreground mt-2 line-clamp-2 text-sm'>
                  {classData.subtitle}
                </p>
              )}
            </div>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>

      <CardHeader className='space-y-3 px-5 pb-0'>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='border-border/60 bg-muted/30 rounded-2xl border p-3'>
            <p className='text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase'>
              Sessions
            </p>
            <p className='text-foreground mt-2 text-2xl font-semibold'>{schedules.length}</p>
            <p className='text-muted-foreground text-xs'>Scheduled instances in this class</p>
          </div>
          <div className='border-border/60 bg-muted/30 rounded-2xl border p-3'>
            <p className='text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase'>
              Classroom
            </p>
            <p className='text-foreground mt-2 line-clamp-2 text-sm font-medium'>{locationLabel}</p>
            <p className='text-muted-foreground text-xs'>
              {classData?.meeting_link ? 'Meeting link available' : 'Launch details on class page'}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className='flex-1 space-y-4 px-5 py-5'>
        {status.label === 'In Progress' && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-xs'>
              <span className='text-muted-foreground'>Course timeline</span>
              <span className='text-foreground font-medium'>{progress}%</span>
            </div>
            <Progress value={progress} className='h-2' />
          </div>
        )}

        <div className='text-muted-foreground space-y-2.5 text-sm'>
          {classData?.instructor?.full_name && (
            <div className='flex items-center gap-2'>
              <User className='h-4 w-4 flex-shrink-0' />
              <span className='truncate'>{classData.instructor.full_name}</span>
            </div>
          )}

          {startDate && (
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4 flex-shrink-0' />
              <span>{format(startDate, 'MMM d, yyyy')}</span>
            </div>
          )}

          {startDate && endDate && (
            <div className='flex items-center gap-2'>
              <Clock className='h-4 w-4 flex-shrink-0' />
              <span>
                {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} day
                {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) === 1
                  ? ''
                  : 's'}
              </span>
            </div>
          )}

          <div className='flex items-center gap-2'>
            {classData?.location_type === 'ONLINE' ? (
              <Video className='h-4 w-4 flex-shrink-0' />
            ) : (
              <MapPin className='h-4 w-4 flex-shrink-0' />
            )}
            <span className='truncate'>{locationLabel}</span>
          </div>
        </div>

        {nextSchedule && (
          <div className='border-primary/15 bg-primary/5 rounded-2xl border p-3'>
            <p className='text-primary text-xs font-medium tracking-[0.2em] uppercase'>
              Next session
            </p>
            <p className='text-foreground mt-2 text-sm font-medium'>{nextSchedule.title}</p>
            <p className='text-muted-foreground mt-1 text-xs'>
              {format(new Date(nextSchedule.start_time), 'EEE, MMM d')} · {nextSchedule.time_range}
            </p>
          </div>
        )}

        {enrollment?.enrollment_date && (
          <div className='border-border/60 bg-background rounded-2xl border p-3'>
            <p className='text-muted-foreground text-xs'>
              Enrolled {format(new Date(enrollment.enrollment_date), 'MMM d, yyyy')}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className='px-5 pt-0 pb-5'>
        <Link href={href} className='w-full'>
          <Button className='w-full gap-2'>
            {status.label === 'Completed' ? 'View class details' : 'Open class workspace'}
            <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default EnrolledClassCard;
