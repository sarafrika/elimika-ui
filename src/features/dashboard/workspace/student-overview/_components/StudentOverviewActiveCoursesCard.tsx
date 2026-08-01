'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowUpRight, Clock, FileText, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';
import { Progress } from '../../../../../../components/ui/progress';
import type {
  StudentOverviewActiveCourse,
  StudentOverviewAssessment,
} from '../useStudentOverviewData';

type StudentOverviewActiveCoursesCardProps = {
  courses: StudentOverviewActiveCourse[];
  upcomingAssessments: StudentOverviewAssessment[];
  isLoading?: boolean;
};

export function StudentOverviewActiveCoursesCard({
  courses,
  upcomingAssessments,
  isLoading,
}: StudentOverviewActiveCoursesCardProps) {
  const hasAssessments = upcomingAssessments.length > 0;

  return (
    <section className='grid gap-4 lg:grid-cols-3'>
      <Card className='lg:col-span-2'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
          <div>
            <CardTitle className='text-base'>Active Courses</CardTitle>
            <CardDescription>Pick up where you left off</CardDescription>
          </div>
          <Button variant='ghost' size='sm' className='text-primary'>
            <Link
              prefetch
              href='/dashboard/student/courses/my-courses'
              className='text-primary hover:text-primary/80 flex shrink-0 flex-row items-center gap-1 text-[0.8rem] font-medium transition'
            >
              View All
              <ArrowUpRight className='ml-1 h-3.5 w-3.5' />
            </Link>
          </Button>
        </CardHeader>

        <CardContent className='space-y-4'>
          {courses.map(c => (
            <div
              key={c.id}
              className='hover:border-primary/30 rounded-lg border p-4 transition-colors'
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='flex flex-row items-center gap-2'>
                  <div className='bg-primary text-primary-foreground grid size-9 shrink-0 place-items-center rounded-[10px] shadow-sm'>
                    <GraduationCap className='size-4' />
                  </div>

                  <div className='min-w-0'>
                    <p className='truncate font-medium'>{c.title}</p>
                    <p className='text-muted-foreground text-xs'>
                      {c.provider} · {c.nextDateLabel}
                    </p>
                  </div>
                </div>

                <Link
                  prefetch
                  href={c.href}
                  className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex shrink-0 items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[0.7rem] font-medium transition'
                >
                  {c.buttonLabel}
                  <ArrowRight className='size-3' />
                </Link>
              </div>

              <div className='mt-3 flex items-center gap-3'>
                <Progress value={c.progress} className='flex-1' />
                <span className='text-muted-foreground w-10 text-right text-xs tabular-nums'>
                  {c.progress}%
                </span>
              </div>
            </div>
          ))}
        </CardContent>

        {isLoading && courses.length === 0 ? (
          <p className='text-muted-foreground mt-3 text-[0.78rem]'>
            Syncing your current courses...
          </p>
        ) : null}

        {!isLoading && courses.length === 0 ? (
          <p className='text-muted-foreground mt-3 text-[0.78rem]'>
            Your active enrollments will show up here once your courses are live.
          </p>
        ) : null}
      </Card>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Clock className='text-primary h-4 w-4' /> Upcoming assessments
          </CardTitle>
          <CardDescription>Assigned but not attempted yet</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {hasAssessments ? (
            upcomingAssessments.map(a => (
              <Link
                key={a.id}
                href={a.href}
                className='hover:border-primary/30 flex items-start gap-3 rounded-lg border p-3 transition-colors'
              >
                <div className='bg-primary/10 text-primary grid h-9 w-9 shrink-0 place-items-center rounded-md'>
                  <FileText className='h-4 w-4' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>{a.title}</p>
                  <p className='text-muted-foreground text-xs'>
                    {a.provider} · {a.dueLabel}
                  </p>
                  <p className='text-muted-foreground mt-1 text-[0.72rem]'>
                    {a.classTitle}
                    {a.courseTitle ? ` · ${a.courseTitle}` : ''}
                  </p>
                </div>
                <Badge variant='secondary' className='h-fit text-[10px]'>
                  {a.badgeLabel}
                </Badge>
              </Link>
            ))
          ) : (
            <div className='rounded-lg border border-dashed p-4'>
              <p className='text-muted-foreground text-sm'>
                No upcoming assessments are waiting for you right now.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
