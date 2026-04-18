import { BriefcaseBusiness, EllipsisVertical, Users } from 'lucide-react';
import { OverviewSectionShell } from './OverviewSectionShell';
import { ActionButton } from './OverviewSharedBits';
import type { OverviewCourse } from './overview-data';
import { skillsProgress } from './overview-data';

type OverviewCourseListPanelProps = {
  courses: OverviewCourse[];
};

function SkillsProgressCard() {
  return (
    <div className='rounded-[10px] border border-[#e6e8fb] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(99,102,241,0.06)]'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2 text-[1rem] font-medium text-slate-700'>
            <BriefcaseBusiness className='size-4 text-blue-600' />
            {skillsProgress.title}
          </div>
          <div className='space-y-0.5'>
            <p className='text-[1.05rem] font-semibold text-slate-900 sm:text-[1.1rem]'>
              {skillsProgress.verifiedSkills}{' '}
              <span className='font-medium text-slate-500'>Verified Skills</span>
            </p>
            <p className='text-sm text-slate-500'>{skillsProgress.growthLabel}</p>
          </div>
        </div>

        <div className='relative flex h-[112px] w-[112px] items-center justify-center rounded-full bg-[conic-gradient(#2fbfa8_0deg_306deg,#60a5fa_306deg_360deg,#e7ebff_360deg)]'>
          <div className='flex h-[82px] w-[82px] flex-col items-center justify-center rounded-full bg-white text-center'>
            <span className='text-[2rem] font-semibold leading-none text-slate-900'>
              {skillsProgress.percent}%
            </span>
            <span className='mt-1 text-[0.54rem] uppercase tracking-[0.08em] text-slate-400'>
              Forte IQ (provat)
            </span>
          </div>
        </div>
      </div>

      <div className='mt-4 grid gap-2 sm:grid-cols-2'>
        <ActionButton label='View My Skills' tone='muted' />
        <ActionButton label='View My Skills' tone='muted' />
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

          <div className='mt-3 flex flex-col gap-3 min-[470px]:flex-row min-[470px]:items-center min-[470px]:justify-between'>
            <div className='flex min-w-0 flex-1 items-center gap-2'>
              <div className='flex items-center gap-1 text-slate-700'>
                <Users className='size-4 text-slate-500' />
                <span className='text-[0.95rem] font-medium'>{course.students} students</span>
              </div>
              <div className='h-2 w-full max-w-[88px] overflow-hidden rounded-full bg-[#e8ecff]'>
                <div className='h-full rounded-full bg-cyan-500' style={{ width: `${course.progress}%` }} />
              </div>
            </div>

            <ActionButton label={course.actionLabel} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function OverviewCourseListPanel({ courses }: OverviewCourseListPanelProps) {
  return (
    <>
      <OverviewSectionShell title='Active Courses' trailingMode='ellipsis'>
        <SkillsProgressCard />
      </OverviewSectionShell>

      <OverviewSectionShell title='Active Courses' onActionLabel='See All'>
        <div className='space-y-3'>
          {courses.map(course => (
            <CourseRow key={course.id} course={course} />
          ))}
        </div>
      </OverviewSectionShell>
    </>
  );
}
