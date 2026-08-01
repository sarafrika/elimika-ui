'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import type { LearningHubLiveClass } from './useStudentLearningHubData';

type LearningHubLiveClassesProps = {
  liveClasses: LearningHubLiveClass[];
  loading?: boolean;
};

export function LearningHubLiveClasses({
  liveClasses,
  loading = false,
}: LearningHubLiveClassesProps) {
  if (loading) {
    return (
      <Card className='border-border/70 bg-background rounded-[18px] border p-3.5 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
        <div className='space-y-2'>
          <Skeleton className='h-5 w-48' />
          <Skeleton className='h-4 w-72' />
        </div>
        <div className='mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_164px] lg:items-end'>
          <div className='border-border/70 bg-background rounded-[10px] border p-3'>
            <div className='border-border/50 space-y-3 border-b pb-3'>
              <Skeleton className='h-5 w-52' />
              <Skeleton className='h-4 w-44' />
            </div>
            <div className='mt-3 flex justify-end'>
              <Skeleton className='h-9 w-28 rounded-[8px]' />
            </div>
          </div>
          <Skeleton className='h-[118px] rounded-[12px]' />
        </div>
      </Card>
    );
  }

  if (!liveClasses.length) {
    return (
      <Card className='border-border/70 bg-background rounded-[18px] border p-3.5 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
        <h2 className='text-foreground text-[1.08rem] font-semibold'>Scheduled Live Classes</h2>
        <p className='text-muted-foreground mt-2 text-[0.84rem]'>
          You do not have any scheduled live classes yet.
        </p>
      </Card>
    );
  }

  return (
    <Card className='border-border/70 bg-background rounded-[18px] border p-3.5 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
      <div className='space-y-1'>
        <h2 className='text-foreground text-[1.08rem] font-semibold'>Scheduled Live Classes</h2>
        <p className='text-muted-foreground text-[0.8rem]'>
          Participate in interactive live sessions with expert instructors.
        </p>
      </div>

      <div className='mt-3 space-y-3'>
        {liveClasses.slice(0, 3).map(liveClass => (
          <div
            key={liveClass.id}
            className='border-border/70 bg-background rounded-[10px] border p-3'
          >
            <div className='border-border/50 flex flex-wrap items-start justify-between gap-3 border-b pb-3'>
              <div>
                <h3 className='text-foreground text-[1rem] font-semibold'>{liveClass.title}</h3>
                <div className='text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-[0.74rem]'>
                  <span>{liveClass.instructor}</span>
                  <span className='bg-border size-1 rounded-full' />
                  <span>{liveClass.locationLabel}</span>
                </div>
              </div>
              <div className='text-muted-foreground text-right text-[0.74rem]'>
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
        ))}
      </div>
    </Card>
  );
}
