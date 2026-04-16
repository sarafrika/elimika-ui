'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookText, Dot, Files, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssignmentCardData } from './assignment-types';
import Link from 'next/link';

type AssignmentCardProps = {
  assignment: AssignmentCardData;
};

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  return (
    <article className='border-border/60 rounded-2xl border bg-white p-4 shadow-sm'>
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex min-w-0 gap-3'>
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                assignment.iconTone === 'amber'
                  ? 'bg-warning/20 text-warning'
                  : 'bg-primary/15 text-primary'
              )}
            >
              <BookText className='h-4 w-4' />
            </div>
            <div className='min-w-0 space-y-1'>
              <p className='text-foreground text-lg font-semibold leading-none'>{assignment.lesson}</p>
              <h2 className='text-foreground truncate text-xl font-medium leading-tight'>
                {assignment.subtitle}
              </h2>
              <p className='text-muted-foreground text-base'>{assignment.dueLabel}</p>
            </div>
          </div>

          <Badge
            variant='outline'
            className={cn(
              'rounded-full px-3 py-1 text-xs',
              assignment.status === 'graded' && 'bg-warning/10 text-foreground',
              assignment.status === 'overdue' && 'bg-destructive/10 text-foreground',
              assignment.status === 'ongoing' && 'bg-success/10 text-foreground'
            )}
          >
            {assignment.statusLabel}
          </Badge>
        </div>

        {assignment.studentSummary ? (
          <div className='flex flex-wrap items-center gap-3 text-sm'>
            <div className='flex items-center gap-2'>
              <Avatar className='h-7 w-7'>
                <AvatarFallback className='text-[10px]'>SO</AvatarFallback>
              </Avatar>
              <span className='text-muted-foreground'>{assignment.studentSummary}</span>
            </div>
            {assignment.badge ? (
              <Badge variant='outline' className='rounded-full bg-primary/10 px-2.5 py-1 text-xs'>
                {assignment.badge}
              </Badge>
            ) : null}
          </div>
        ) : assignment.badge ? (
          <Badge variant='outline' className='w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs'>
            {assignment.badge}
          </Badge>
        ) : null}

        <div className='border-border/50 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between'>
          <div className='flex min-w-0 flex-wrap items-center gap-3 text-sm'>
            <div className='flex items-center gap-2 text-primary'>
              <Files className='h-4 w-4' />
              <span className='text-foreground'>View Submissions</span>
            </div>
            {assignment.metricValue ? (
              <div className='flex flex-wrap items-center gap-3 text-muted-foreground'>
                <div className='flex items-center gap-2'>
                  <GraduationCap className='h-4 w-4 text-primary' />
                  <span>{assignment.metricValue}</span>
                </div>
                {assignment.metricLabel ? (
                  <div className='flex items-center gap-1 text-foreground'>
                    <Dot className='h-4 w-4 fill-current text-sky-400' />
                    <span>{assignment.metricLabel}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <Button
            asChild
            className={cn(
              'h-10 rounded-lg px-4',
              assignment.ctaLabel === 'Grade Now'
                ? 'bg-warning text-warning-foreground hover:bg-warning/90'
                : 'bg-primary hover:bg-primary/90'
            )}
          >
            <Link href={`/dashboard/assignment/${assignment.id}`}>{assignment.ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
