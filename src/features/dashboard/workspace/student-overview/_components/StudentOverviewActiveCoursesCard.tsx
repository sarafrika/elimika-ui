'use client';

import { Card } from '@/components/ui/card';
import { ArrowRight, CalendarDays, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import type { StudentOverviewActiveCourse } from '../useStudentOverviewData';

type StudentOverviewActiveCoursesCardProps = {
  courses: StudentOverviewActiveCourse[];
  isLoading?: boolean;
};

export function StudentOverviewActiveCoursesCard({
  courses,
  isLoading,
}: StudentOverviewActiveCoursesCardProps) {
  return (
    <Card className='rounded-[20px] border-slate-200 bg-white p-4 shadow-[0_24px_55px_-48px_rgba(15,23,42,0.22)] sm:p-6'>
      <div className='flex min-w-0 items-center justify-between gap-3'>
        <h2 className='min-w-0 truncate text-[1rem] font-semibold text-slate-900'>
          Active Courses
        </h2>
        <Link
          prefetch
          href='/dashboard/courses'
          className='shrink-0 text-[0.8rem] font-medium text-primary transition hover:text-primary/80'
        >
          See All
        </Link>
      </div>

      <div className='mt-2.5 space-y-2.5'>
        {courses.map(course => (
          <div
            key={course.id}
            className='overflow-hidden rounded-[12px] border border-slate-200 bg-white p-3'
          >
            <div className='flex min-w-0 items-start gap-3'>
              <div className='grid size-9 shrink-0 place-items-center rounded-[10px] bg-[linear-gradient(180deg,#4d97ff,#2a6fdd)] text-white shadow-sm'>
                <GraduationCap className='size-4' />
              </div>

              <div className='min-w-0 flex-1'>
                <div className='flex min-w-0 items-start justify-between gap-3'>
                  <div className='min-w-0 w-0 flex-1'>
                    <h3
                      className='block max-w-full truncate text-[14px] font-semibold text-slate-900'
                      title={course.title}
                    >
                      {course.title}
                    </h3>
                    <p
                      className='mt-0.5 block max-w-full truncate text-[0.74rem] text-slate-500'
                      title={course.subtitle}
                    >
                      {course.subtitle}
                    </p>
                  </div>

                  <div className='min-w-0 shrink-0 text-right'>
                    <div className='text-[1.28rem] leading-none font-semibold text-slate-800'>
                      {course.progress}%
                    </div>
                    <div className='mt-1.5 h-1.5 w-14 overflow-hidden rounded-full bg-slate-200'>
                      <div
                        className='h-full rounded-full bg-[linear-gradient(90deg,#7ed7a2,#5d8df6)]'
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className='mt-2 flex min-w-0 flex-wrap items-center justify-between gap-2'>
                  <span
                    className='inline-flex min-w-0 max-w-full items-center gap-1 truncate rounded-[9px] bg-[color-mix(in_srgb,var(--primary)_8%,white)] px-2 py-1 text-[0.66rem] font-medium text-slate-600'
                    title={course.nextDateLabel}
                  >
                    <CalendarDays className='size-3 shrink-0 text-primary' />
                    <span className='min-w-0 truncate'>{course.nextDateLabel}</span>
                  </span>
                  <Link
                    prefetch
                    href={course.href}
                    className='inline-flex shrink-0 items-center gap-1 rounded-[8px] bg-primary px-2.5 py-1.5 text-[0.7rem] font-medium text-primary-foreground transition hover:bg-primary/90'
                  >
                    {course.buttonLabel}
                    <ArrowRight className='size-3' />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isLoading && courses.length === 0 ? (
        <p className='mt-3 text-[0.78rem] text-slate-500'>Syncing your current courses...</p>
      ) : null}

      {!isLoading && courses.length === 0 ? (
        <p className='mt-3 text-[0.78rem] text-slate-500'>
          Your active enrollments will show up here once your courses are live.
        </p>
      ) : null}

      <div className='mt-3 flex justify-end'>
        <Link
          prefetch
          href='/dashboard/courses'
          className='inline-flex items-center gap-1 text-[0.8rem] font-medium text-primary transition hover:text-primary/80'
        >
          See All Courses
          <ArrowRight className='size-3.5' />
        </Link>
      </div>
    </Card>
  );
}
