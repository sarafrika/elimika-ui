import type { ReactNode } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { CourseBlockAsyncProps } from '../types';
import {
  COURSE_PLACEHOLDER,
  clampCoursePercent,
  formatCourseCount,
  formatCourseDate,
} from './_shared';

/**
 * The enrolled learner's progress strip, which stands where every other viewer
 * gets a KPI band — the capability map says so with `showProgressStrip`, and the
 * shell renders one or the other.
 *
 * Nothing here is course-wide: how far *you* are, what is next for *you*, the
 * assessments *you* have passed, the class *you* are on. A figure the response
 * did not carry is left as a dash rather than a zero, which on a progress card
 * would read as a failure rather than as silence.
 */

const PROGRESS_LABEL = 'Your progress';
const NEXT_UP_LABEL = 'Next up';
const ASSESSMENTS_LABEL = 'Assessments passed';
const CLASS_LABEL = 'Class';

export interface ProgressStripProps extends CourseBlockAsyncProps {
  /** Completion of the enrolment, 0–100. */
  percent?: number;
  completedLessons?: number;
  totalLessons?: number;
  /** ISO date the learner enrolled. */
  enrolledOn?: string;
  /** The next item to open, e.g. "L8 · Inverter sizing". */
  nextUp?: string;
  assessmentsPassed?: number;
  assessmentsTotal?: number;
  /** The class the learner is enrolled on, e.g. "Nairobi Skills · Cohort 12". */
  classTitle?: string;
  className?: string;
}

export function ProgressStrip({
  percent,
  completedLessons,
  totalLessons,
  enrolledOn,
  nextUp,
  assessmentsPassed,
  assessmentsTotal,
  classTitle,
  loading,
  error,
  onRetry,
  className,
}: ProgressStripProps) {
  const enrolled = formatCourseDate(enrolledOn);
  const sub = [
    completedLessons === undefined || totalLessons === undefined
      ? undefined
      : `${formatCourseCount(completedLessons)} of ${formatCourseCount(totalLessons)} lessons complete`,
    enrolled ? `enrolled ${enrolled}` : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  const assessments =
    assessmentsPassed === undefined || assessmentsTotal === undefined
      ? COURSE_PLACEHOLDER
      : `${formatCourseCount(assessmentsPassed)} of ${formatCourseCount(assessmentsTotal)}`;

  return (
    <Card className={cn('border-l-primary gap-0 border-l-4 px-[22px] py-[18px]', className)}>
      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={percent === undefined && !nextUp && !classTitle}
        skeleton={<ProgressStripSkeleton />}
        errorTitle='Couldn’t load your progress'
        emptyTitle='No progress recorded yet'
        emptyDescription='Open a lesson and your place in the course is saved as you go.'
      >
        <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_200px_200px_200px] xl:items-center'>
          <div className='min-w-0'>
            <div className='text-muted-foreground text-[13px] font-semibold'>{PROGRESS_LABEL}</div>
            <div className='mt-2 flex items-center gap-3'>
              <Progress
                value={percent === undefined ? 0 : clampCoursePercent(percent)}
                className='bg-muted h-2 flex-1'
                aria-label={PROGRESS_LABEL}
              />
              <span className='text-lg font-bold tracking-[-0.02em]'>
                {percent === undefined ? COURSE_PLACEHOLDER : `${Math.round(percent)}%`}
              </span>
            </div>
            {sub ? <div className='text-muted-foreground mt-1.5 text-xs'>{sub}</div> : null}
          </div>

          <Field label={NEXT_UP_LABEL}>{nextUp ?? COURSE_PLACEHOLDER}</Field>
          <Field label={ASSESSMENTS_LABEL}>{assessments}</Field>
          <Field label={CLASS_LABEL}>{classTitle ?? COURSE_PLACEHOLDER}</Field>
        </div>
      </AsyncSection>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='min-w-0'>
      <div className='text-muted-foreground text-xs font-semibold'>{label}</div>
      <div className='mt-1 truncate text-sm font-semibold'>{children}</div>
    </div>
  );
}

export function ProgressStripSkeleton() {
  return (
    <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_200px_200px_200px] xl:items-center'>
      <div>
        <Skeleton className='h-3 w-24' />
        <div className='mt-2 flex items-center gap-3'>
          <Skeleton className='h-2 flex-1 rounded-full' />
          <Skeleton className='h-5 w-10' />
        </div>
        <Skeleton className='mt-2 h-3 w-52' />
      </div>
      {[0, 1, 2].map(field => (
        <div key={field}>
          <Skeleton className='h-3 w-20' />
          <Skeleton className='mt-1.5 h-4 w-28' />
        </div>
      ))}
    </div>
  );
}
