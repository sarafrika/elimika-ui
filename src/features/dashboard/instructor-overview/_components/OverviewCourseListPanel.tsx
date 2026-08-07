import { BriefcaseBusiness, Users } from 'lucide-react';
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
    <div className='bg-card rounded-[10px] p-2'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='space-y-1'>
          <div className='text-foreground flex items-center gap-2 text-[1rem] font-medium'>
            <BriefcaseBusiness className='text-primary size-4' />
            {summary.title}
          </div>
          <div className='space-y-0.5'>
            <p className='text-foreground text-[1.05rem] font-semibold sm:text-[1.1rem]'>
              {summary.primaryValue}
            </p>
            <p className='text-muted-foreground text-sm'>{summary.secondaryValue}</p>
          </div>
        </div>

        <div className='relative flex h-[112px] w-[112px] items-center justify-center rounded-full bg-[conic-gradient(color-mix(in_srgb,var(--success)_76%,white)_0deg_306deg,color-mix(in_srgb,var(--primary)_76%,white)_306deg_360deg,color-mix(in_srgb,var(--muted)_80%,white)_360deg)]'>
          <div className='bg-card flex h-[82px] w-[82px] flex-col items-center justify-center rounded-full text-center'>
            <span className='text-foreground text-[2rem] leading-none font-semibold'>
              {summary.percent}%
            </span>
            <span className='text-muted-foreground mt-1 text-[0.54rem] tracking-[0.08em] uppercase'>
              Overall progress
            </span>
          </div>
        </div>
      </div>

      <div className='mt-4 flex items-center gap-2 sm:flex-row'>
        <ActionButton
          label={summary.primaryActionLabel}
          tone='muted'
          href={'/dashboard/instructor/training-hub'}
        />
        <ActionButton
          label={summary.secondaryActionLabel}
          tone='muted'
          href={'/dashboard/instructor/assignment'}
        />
      </div>
    </div>
  );
}

function CourseRow({ course }: { course: OverviewCourse }) {
  const Icon = course.icon;

  return (
    <article className='border-border bg-card w-full min-w-0 overflow-hidden rounded-[10px] border p-3 shadow-sm'>
      <div className='flex w-full min-w-0 gap-3'>
        {/* icon */}

        {/* content */}
        <div className='min-w-0 flex-1'>
          <div className='flex flex-row items-center gap-2'>
            <div className='shrink-0'>
              <div className='bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-[8px]'>
                <Icon className='size-4' />
              </div>
            </div>

            {/* title block */}
            <div className='min-w-0'>
              <h3 className='text-foreground block w-full min-w-0 truncate text-[1rem] font-semibold sm:text-[1.05rem]'>
                {' '}
                {course?.title}{' '}
              </h3>

              <p className='text-muted-foreground block w-full min-w-0 truncate text-sm'>
                <span className='text-primary'>{course.provider}</span> | {course.level}
              </p>
            </div>
          </div>

          {/* stats */}
          <div className='mt-3 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'>
            <div className='flex min-w-0 items-center gap-1'>
              <Users className='text-muted-foreground size-4 shrink-0' />
              <span className='truncate text-[0.95rem] font-medium'>
                {course.students} students
              </span>
            </div>

            <div className='bg-muted h-2 w-full overflow-hidden rounded-full sm:max-w-[120px]'>
              <div
                className='bg-primary h-full rounded-full'
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>

          {/* actions */}
          <div className='mt-4 flex flex-row justify-end gap-2 sm:flex-row'>
            <ActionButton href={course.viewHref} label={course.actionLabel} />

            <Link
              href={course.editHref}
              className='border-border bg-card text-foreground hover:bg-muted/50 inline-flex h-8 items-center justify-center rounded-[6px] border px-4 text-[0.82rem] font-medium'
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
    <div className='space-y-4'>
      <OverviewSectionShell title='Active Courses' trailingMode='none'>
        <SkillsProgressCard summary={summary} />
      </OverviewSectionShell>

      <OverviewSectionShell
        title='Active Courses'
        onActionLabel='See All'
        onActionHref='/dashboard/instructor/courses'
      >
        {courses.length ? (
          <div className='w-full min-w-0 space-y-3 overflow-hidden'>
            {courses.map(course => (
              <CourseRow key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <p className='border-border bg-card text-muted-foreground rounded-[10px] border border-dashed px-4 py-6 text-sm'>
            No active classes found for this instructor yet.
          </p>
        )}
      </OverviewSectionShell>
    </div>
  );
}
