'use client';

import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

type StudentOverviewSkillsCardProps = {
  progress: number;
  verifiedSkills: number;
  newSkillsThisMonth: number;
};

export function StudentOverviewSkillsCard({
  progress,
  verifiedSkills,
  newSkillsThisMonth,
}: StudentOverviewSkillsCardProps) {
  return (
    <Card className='rounded-[20px] border-slate-200 bg-white p-6'>
      <div className='flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0 flex-1'>
          <h2 className='text-[1rem] font-semibold text-slate-900'>Skills Progress</h2>
          <div className='mt-2 text-[2rem] leading-none font-semibold tracking-tight text-slate-900'>
            {progress}%
          </div>
          <div className='mt-2 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-slate-200'>
            <div
              className='h-full rounded-full bg-[linear-gradient(90deg,#7ed7a2,#5d8df6)]'
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className='mt-1.5 text-[0.96rem] font-semibold text-slate-900'>
            {verifiedSkills} <span className='font-medium text-slate-600'>Verified Skills</span>
          </div>
          <p className='mt-1 text-[0.8rem] text-slate-500'>+{newSkillsThisMonth} this month</p>
        </div>

        <div
          className='grid size-[108px] shrink-0 place-items-center rounded-full'
          style={{
            background: `conic-gradient(
              color-mix(in srgb, var(--primary) 78%, white) 0 ${progress}%,
              color-mix(in srgb, var(--success) 82%, white) ${progress}% ${Math.min(progress + 10, 100)}%,
              color-mix(in srgb, var(--warning) 70%, white) ${Math.min(progress + 10, 100)}% ${Math.min(progress + 15, 100)}%,
              rgba(191,219,254,0.55) ${Math.min(progress + 15, 100)}% 100%
            )`,
          }}
        >
          <div className='grid size-[82px] place-items-center rounded-full bg-white text-center'>
            <div>
              <div className='text-[1.55rem] leading-none font-semibold text-slate-900'>{progress}%</div>
              <div className='mt-0.5 text-[0.5rem] uppercase tracking-[0.12em] text-slate-400'>
                skill progress
              </div>
              <div className='text-[0.55rem] text-slate-400'>+{newSkillsThisMonth} this month</div>
            </div>
          </div>
        </div>
      </div>

      <div className='flex min-w-0 flex-wrap items-end justify-end gap-2 px-3'>
        <Link
          prefetch
          href='/dashboard/my-skills'
          className='inline-flex items-center gap-1.5 rounded-[9px] border border-slate-200 bg-white px-2.5 py-1.5 text-[0.76rem] font-medium text-slate-600 transition hover:text-primary'
        >
          View My Skills
          <ArrowRight className='size-3.5' />
        </Link>
      </div>
    </Card>
  );
}
