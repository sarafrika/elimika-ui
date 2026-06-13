'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LearningHubInvite } from './useStudentLearningHubData';

type LearningHubClassInviteProps = {
  invite: LearningHubInvite | null;
  loading?: boolean;
};

export function LearningHubClassInvite({
  invite,
  loading = false,
}: LearningHubClassInviteProps) {
  if (loading) {
    return (
      <Card className='rounded-[18px] border border-border/70 bg-background p-3 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
        <Skeleton className='h-5 w-32' />
        <div className='mt-3 rounded-[12px] border border-border/70 bg-background p-3'>
          <div className='space-y-2'>
            <Skeleton className='h-5 w-44' />
            <Skeleton className='h-4 w-36' />
            <Skeleton className='h-4 w-32' />
          </div>
          <Skeleton className='mt-4 h-9 w-full rounded-[8px]' />
        </div>
      </Card>
    );
  }

  if (!invite) {
    return null;
  }

  return (
    <Card className='rounded-[18px] border border-border/70 bg-background p-3 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
      <h2 className='text-[1rem] font-semibold text-foreground'>Class Invites (10)</h2>
      <div className='mt-3 rounded-[12px] border border-border/70 bg-background p-3'>
        <h3 className='text-[0.96rem] font-semibold text-foreground'>{invite.title}</h3>
        <p className='mt-1 text-[0.78rem] text-muted-foreground'>{invite.subtitle}</p>
        <p className='mt-2 text-[0.74rem] text-muted-foreground'>{invite.timeLabel}</p>
        <Link
          prefetch
          href={invite.href}
          className='mt-4 inline-flex w-full items-center justify-center rounded-[8px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_88%,black_8%),color-mix(in_srgb,var(--primary)_74%,black_18%))] px-4 py-2 text-[0.78rem] font-medium text-white transition hover:opacity-95'
        >
          Join Class
        </Link>
      </div>
    </Card>
  );
}
