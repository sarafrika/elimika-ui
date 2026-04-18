'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import type { LearningHubLiveClass } from './useStudentLearningHubData';

type LearningHubLiveClassesProps = {
  liveClass: LearningHubLiveClass | null;
};

export function LearningHubLiveClasses({ liveClass }: LearningHubLiveClassesProps) {
  if (!liveClass) {
    return (
      <Card className='rounded-[18px] border border-border/70 bg-background p-3.5 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
        <h2 className='text-[1.08rem] font-semibold text-foreground'>Scheduled Live Classes</h2>
        <p className='mt-2 text-[0.84rem] text-muted-foreground'>
          You do not have a scheduled live class yet.
        </p>
      </Card>
    );
  }

  return (
    <Card className='rounded-[18px] border border-border/70 bg-background p-3.5 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
      <div className='space-y-1'>
        <h2 className='text-[1.08rem] font-semibold text-foreground'>Scheduled Live Classes</h2>
        <p className='text-[0.8rem] text-muted-foreground'>
          Participate in interactive live - sessions with expert instructors.
        </p>
      </div>

      <div className='mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_164px] lg:items-end'>
        <div className='rounded-[10px] border border-border/70 bg-background p-3'>
          <div className='flex flex-wrap items-start justify-between gap-3 border-b border-border/50 pb-3'>
            <div>
              <h3 className='text-[1rem] font-semibold text-foreground'>{liveClass.title}</h3>
              <div className='mt-2 flex flex-wrap items-center gap-2 text-[0.74rem] text-muted-foreground'>
                <span>{liveClass.instructor}</span>
                <span className='size-1 rounded-full bg-border' />
                <span>{liveClass.secondaryInstructor}</span>
              </div>
            </div>
            <div className='text-right text-[0.74rem] text-muted-foreground'>
              <div>{liveClass.dateLabel}</div>
              <div>{liveClass.timeLabel}</div>
            </div>
          </div>
          <div className='mt-3 flex justify-end'>
            <Link
              prefetch
              href={liveClass.href}
              className='inline-flex items-center justify-center rounded-[8px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_88%,black_8%),color-mix(in_srgb,var(--primary)_74%,black_18%))] px-4 py-2 text-[0.78rem] font-medium text-white transition hover:opacity-95'
            >
              Join Class
            </Link>
          </div>
        </div>

        <div className='h-[118px] rounded-[12px] border border-border/50 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_10%,white),white)]' />
      </div>
    </Card>
  );
}
