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
    <div className='rounded-[10px] bg-card p-2'>
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

      <div className='mt-4 flex gap-2 sm:flex-row items-center'>
        <ActionButton label={summary.primaryActionLabel} tone='muted' href={'/dashboard/training-hub'} />
        <ActionButton label={summary.secondaryActionLabel} tone='muted' href={'/dashboard/assignment'} />
      </div>
    </div>
  );
}

function CourseRow({ course }: { course: OverviewCourse }) {
  const Icon = course.icon;

  return (
    <article className='w-full min-w-0 overflow-hidden rounded-[10px] border border-border bg-card p-3 shadow-sm'>

      <div className='flex w-full min-w-0 gap-3'>

        {/* icon */}


        {/* content */}
        <div className='min-w-0 flex-1'>

          <div className='flex flex-row items-center gap-2' >
            <div className='shrink-0'>
              <div className='flex h-9 w-9 items-center justify-center rounded-[8px] bg-primary text-primary-foreground'>
                <Icon className='size-4' />
              </div>
            </div>

            {/* title block */}
            <div className='min-w-0'>
              <h3 className='block w-full min-w-0 truncate text-[1rem] font-semibold text-foreground sm:text-[1.05rem]'>              {course?.title}            </h3>

              <p className='block w-full min-w-0 truncate text-sm text-muted-foreground'>
                <span className='text-primary'>{course.provider}</span> | {course.level}
              </p>
            </div>
          </div>

          {/* stats */}
          <div className='mt-3 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'>

            <div className='flex min-w-0 items-center gap-1'>
              <Users className='size-4 shrink-0 text-muted-foreground' />
              <span className='truncate text-[0.95rem] font-medium'>
                {course.students} students
              </span>
            </div>

            <div className='h-2 w-full overflow-hidden rounded-full bg-muted sm:max-w-[120px]'>
              <div
                className='h-full rounded-full bg-primary'
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>

          {/* actions */}
          <div className='mt-4 flex flex-row gap-2 sm:flex-row justify-end'>
            <ActionButton href={course.viewHref} label={course.actionLabel} />

            <Link
              href={course.editHref}
              className='inline-flex h-8 items-center justify-center rounded-[6px] border border-border bg-card px-4 text-[0.82rem] font-medium text-foreground hover:bg-muted/50'
            >
              Edit Class
            </Link>
          </div>

        </div>
      </div>
    </article>
  );
}

export function OverviewCourseListPanel({
  courses,
  summary,
}: OverviewCourseListPanelProps) {
  return (
    <div className='space-y-4'>

      <OverviewSectionShell
        title='Active Courses'
        trailingMode='none'
      >
        <SkillsProgressCard summary={summary} />
      </OverviewSectionShell>

      <OverviewSectionShell
        title='Active Courses'
        onActionLabel='See All'
        onActionHref='/dashboard/workspace/instructor/courses'
      >
        {courses.length ? (
          <div className='w-full min-w-0 space-y-3 overflow-hidden'>
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

    </div>
  );
}
