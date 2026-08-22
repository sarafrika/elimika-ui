'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';
import type { LearningHubAssignment } from './useStudentLearningHubData';

type LearningHubAssignmentsProps = {
  assignments: LearningHubAssignment[];
  loading?: boolean;
};

export function LearningHubAssignments({
  assignments,
  loading = false,
}: LearningHubAssignmentsProps) {
  return (
    <Card className='border-border/70 bg-background rounded-[18px] border p-3.5 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='space-y-1'>
          <h2 className='text-foreground text-[1.08rem] font-semibold'>Assignments</h2>
          <p className='text-muted-foreground text-[0.8rem]'>
            Manage and complete your latest assignments.
          </p>
        </div>
        <Link
          prefetch
          href='/dashboard/student/learning-hub?tab=assignments'
          className='text-primary hover:text-primary/80 inline-flex items-center gap-1 text-[0.82rem] font-medium transition'
        >
          View All Assignments
          <ChevronRight className='size-4' />
        </Link>
      </div>
      <div className='mt-3 space-y-3'>
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`learning-assignment-skeleton-${index}`}
              className='border-border/70 bg-background rounded-[10px] border px-3 py-3'
            >
              <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                <div className='min-w-0 flex-1 space-y-3'>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='size-7 rounded-[8px]' />
                    <Skeleton className='h-5 w-52' />
                  </div>
                  <Skeleton className='h-10 w-full' />
                  <Skeleton className='h-4 w-40' />
                </div>
                <Skeleton className='h-9 w-28 rounded-[8px]' />
              </div>
            </div>
          ))
        ) : assignments.length === 0 ? (
          <div className='border-border/70 bg-background flex flex-col items-center justify-center rounded-[10px] border border-dashed px-6 py-10 text-center'>
            <div className='bg-muted flex size-12 items-center justify-center rounded-full'>
              <FileText className='text-muted-foreground size-5' />
            </div>

            <h3 className='text-foreground mt-4 text-sm font-semibold'>No assignments yet</h3>

            <p className='text-muted-foreground mt-1 max-w-sm text-[0.84rem]'>
              You currently don&apos;t have any learning assignments assigned to you.
            </p>
          </div>
        ) : (
          assignments.map(item => (
            <div
              key={item.id}
              className='border-border/70 bg-background rounded-[10px] border px-3 py-3'
            >
              <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-primary inline-flex size-7 items-center justify-center rounded-[8px] bg-[color-mix(in_srgb,var(--primary)_10%,white)]'>
                      <FileText className='size-4' />
                    </span>

                    <h3 className='text-foreground truncate text-[0.98rem] font-semibold'>
                      {item.title}
                    </h3>
                  </div>

                  <p className='text-muted-foreground mt-2 line-clamp-2 text-[0.84rem]'>
                    {item.summary}
                  </p>

                  <div className='text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-[0.72rem]'>
                    <span>{item.dueLabel}</span>

                    <span className='bg-border size-1 rounded-full' />

                    <span>{item.statusLabel}</span>
                  </div>
                </div>

                <div className='flex shrink-0 flex-wrap items-center gap-2'>
                  <Link
                    prefetch
                    href={item.href}
                    className='inline-flex h-9 shrink-0 items-center justify-center rounded-[8px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--success)_80%,black_6%),color-mix(in_srgb,var(--success)_70%,black_18%))] px-4 py-2 text-[0.78rem] font-medium whitespace-nowrap text-white transition hover:opacity-95'
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
