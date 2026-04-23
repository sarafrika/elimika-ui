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
    <div className='rounded-[10px] border border-[#e6e8fb] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(99,102,241,0.06)]'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2 text-[1rem] font-medium text-slate-700'>
            <BriefcaseBusiness className='size-4 text-blue-600' />
            {summary.title}
          </div>
          <div className='space-y-0.5'>
            <p className='text-[1.05rem] font-semibold text-slate-900 sm:text-[1.1rem]'>
              {summary.primaryValue}
            </p>
            <p className='text-sm text-slate-500'>{summary.secondaryValue}</p>
          </div>
        </div>

        <div className='relative flex h-[112px] w-[112px] items-center justify-center rounded-full bg-[conic-gradient(#2fbfa8_0deg_306deg,#60a5fa_306deg_360deg,#e7ebff_360deg)]'>
          <div className='flex h-[82px] w-[82px] flex-col items-center justify-center rounded-full bg-white text-center'>
            <span className='text-[2rem] font-semibold leading-none text-slate-900'>
              {summary.percent}%
            </span>
            <span className='mt-1 text-[0.54rem] uppercase tracking-[0.08em] text-slate-400'>
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
    <article className='rounded-[10px] border border-[#e6e8fb] bg-white px-3 py-3 shadow-[0_6px_18px_rgba(99,102,241,0.04)]'>
      <div className='flex items-start gap-3'>
        <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-blue-600 text-white'>
          <Icon className='size-4' />
        </div>

        <div className='min-w-0 flex-1'>
          {/* Header */}
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h3 className='truncate text-[1rem] font-semibold text-slate-900 sm:text-[1.05rem]'>
                {course.title}
              </h3>
              <p className='truncate text-sm text-slate-500'>
                <span className='text-blue-600'>{course.provider}</span> | {course.level}
              </p>
            </div>

            <button
              type='button'
              aria-label={`${course.title} options`}
              className='text-slate-400 transition hover:text-slate-600'
            >
              <EllipsisVertical className='size-4' />
            </button>
          </div>

          {/* Students + Progress */}
          <div className='mt-3 flex items-center gap-3'>
            <div className='flex items-center gap-1 text-slate-700'>
              <Users className='size-4 text-slate-500' />
              <span className='text-[0.95rem] font-medium'>
                {course.students} students
              </span>
            </div>

            <div className='h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-[#e8ecff]'>
              <div
                className='h-full rounded-full bg-cyan-500'
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>

          {/* Action button (separate row) */}
          <div className='mt-4 flex flex-wrap justify-end gap-2'>
            <ActionButton href={course.viewHref} label={course.actionLabel} />
            <Link
              href={course.editHref}
              className='inline-flex h-8 items-center justify-center rounded-[6px] border border-slate-200 bg-white px-4 text-[0.82rem] font-medium text-slate-700 transition hover:bg-slate-50'
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
          <p className='rounded-[10px] border border-dashed border-[#d7dbfb] bg-white px-4 py-6 text-sm text-slate-500'>
            No active classes found for this instructor yet.
          </p>
        )}
      </OverviewSectionShell>
    </>
  );
}
