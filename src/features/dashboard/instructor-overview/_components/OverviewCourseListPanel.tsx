import { BriefcaseBusiness, EllipsisVertical, Users } from 'lucide-react';
import Link from 'next/link';
import { OverviewSectionShell } from './OverviewSectionShell';
import { ActionButton } from './OverviewSharedBits';
import type { OverviewCourse, OverviewCourseSummary } from './overview-data';

type OverviewCourseListPanelProps = {
  courses: OverviewCourse[];
  summary: OverviewCourseSummary;
};

function SkillsProgressCard({ summary }: { summary: OverviewCourseSummary }) {
  return (
    <div className='rounded-[10px] border border-border bg-card px-4 py-3 shadow-sm'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2 text-[1rem] font-medium text-foreground'>
            <BriefcaseBusiness className='size-4 text-primary' />
            {summary.title}
          </div>
          <div className='space-y-0.5'>
            <p className='text-[1.05rem] font-semibold text-foreground sm:text-[1.1rem]'>
              {summary.primaryValue}
            </p>
            <p className='text-sm text-muted-foreground'>{summary.secondaryValue}</p>
          </div>
        </div>

        <div className='relative flex h-[112px] w-[112px] items-center justify-center rounded-full bg-[conic-gradient(color-mix(in_srgb,var(--success)_76%,white)_0deg_306deg,color-mix(in_srgb,var(--primary)_76%,white)_306deg_360deg,color-mix(in_srgb,var(--muted)_80%,white)_360deg)]'>
          <div className='flex h-[82px] w-[82px] flex-col items-center justify-center rounded-full bg-card text-center'>
            <span className='text-[2rem] font-semibold leading-none text-foreground'>
              {summary.percent}%
            </span>
            <span className='mt-1 text-[0.54rem] uppercase tracking-[0.08em] text-muted-foreground'>
              Overall progress
            </span>
          </div>
        </div>
      </div>

      <div className='mt-4 grid gap-2 sm:grid-cols-2'>
        <ActionButton label={summary.primaryActionLabel} tone='muted' href={'/dashboard/classes'} />
        <ActionButton label={summary.secondaryActionLabel} tone='muted' href={'/dashboard/assignments'} />
      </div>
    </div>
  );
}

function CourseRow({ course }: { course: OverviewCourse }) {
  const Icon = course.icon;

  return (
    <article className='rounded-[10px] border border-border bg-card px-3 py-3 shadow-sm'>
      <div className='flex items-start gap-3'>
        <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-primary text-primary-foreground'>
          <Icon className='size-4' />
        </div>

        <div className='min-w-0 flex-1'>
          {/* Header */}
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h3 className='truncate text-[1rem] font-semibold text-foreground sm:text-[1.05rem]'>
                {course.title}
              </h3>
              <p className='truncate text-sm text-muted-foreground'>
                <span className='text-primary'>{course.provider}</span> | {course.level}
              </p>
            </div>

            <button
              type='button'
              aria-label={`${course.title} options`}
              className='text-muted-foreground transition hover:text-foreground'
            >
              <EllipsisVertical className='size-4' />
            </button>
          </div>

          {/* Students + Progress */}
          <div className='mt-3 flex items-center gap-3'>
            <div className='flex items-center gap-1 text-foreground'>
              <Users className='size-4 text-muted-foreground' />
              <span className='text-[0.95rem] font-medium'>
                {course.students} students
              </span>
            </div>

            <div className='h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-muted'>
              <div
                className='h-full rounded-full bg-primary'
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>

          {/* Action button (separate row) */}
          <div className='mt-4 flex flex-wrap justify-end gap-2'>
            <ActionButton href={course.viewHref} label={course.actionLabel} />
            <Link
              href={course.editHref}
              className='inline-flex h-8 items-center justify-center rounded-[6px] border border-border bg-card px-4 text-[0.82rem] font-medium text-foreground transition hover:bg-muted/50'
            >
              Edit Class
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function OverviewCourseListPanel({ courses, summary }: OverviewCourseListPanelProps) {
  return (
    <>
      <OverviewSectionShell title='Active Courses' trailingMode='ellipsis' onActionHref='#' >
        <SkillsProgressCard summary={summary} />
      </OverviewSectionShell>

      <OverviewSectionShell title='Active Courses' onActionLabel='See All' onActionHref='/dashboard/workspace/instructor/courses' >
        {courses.length ? (
          <div className='space-y-3'>
            {courses.map(course => (
              <CourseRow key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <p className='rounded-[10px] border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground'>
            No active classes found for this instructor yet.
          </p>
        )}
      </OverviewSectionShell>
    </>
  );
}
