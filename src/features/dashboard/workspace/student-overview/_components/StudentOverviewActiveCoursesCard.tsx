'use client';

import { ArrowRight, ArrowUpRight, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { AsyncSection } from '@/components/data/async-section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '../../../../../../components/ui/button';
import { Progress } from '../../../../../../components/ui/progress';
import { useStudentActiveCourses } from '../useStudentActiveCourses';

function ActiveCoursesSkeleton() {
  return (
    <div className='space-y-4'>
      {[0, 1].map(item => (
        <Skeleton key={item} className='h-[92px] w-full rounded-lg' />
      ))}
    </div>
  );
}

export function StudentOverviewActiveCoursesCard() {
  const { data: courses, isLoading, error, refetch } = useStudentActiveCourses();

  return (
    <Card className='lg:col-span-2'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
        <div>
          <CardTitle className='text-base'>Active Courses</CardTitle>
          <CardDescription>Pick up where you left off</CardDescription>
        </div>
        <Button asChild variant='ghost' size='sm' className='text-primary'>
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
        <AsyncSection
          name='student-overview-active-courses'
          loading={isLoading}
          error={error}
          onRetry={refetch}
          errorTitle='Couldn’t load your courses'
          empty={courses.length === 0}
          skeleton={<ActiveCoursesSkeleton />}
          emptyState={
            <p className='text-muted-foreground mt-3 text-center text-[0.78rem]'>
              Your active enrollments will show up here once your courses are live.
            </p>
          }
        >
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
                  href='/dashboard/student/courses/my-courses'
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
        </AsyncSection>
      </CardContent>
    </Card>
  );
}
