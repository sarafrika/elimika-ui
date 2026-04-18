'use client';

import Link from 'next/link';
import { ChevronRight, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { LearningHubAssignment } from './useStudentLearningHubData';

type LearningHubAssignmentsProps = {
  assignments: LearningHubAssignment[];
};

export function LearningHubAssignments({ assignments }: LearningHubAssignmentsProps) {
  return (
    <Card className='rounded-[18px] border border-border/70 bg-background p-3.5 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='space-y-1'>
          <h2 className='text-[1.08rem] font-semibold text-foreground'>Assignments</h2>
          <p className='text-[0.8rem] text-muted-foreground'>
            Manage and complete your latest assignments.
          </p>
        </div>
        <Link
          prefetch
          href='/dashboard/assignment'
          className='inline-flex items-center gap-1 text-[0.82rem] font-medium text-primary transition hover:text-primary/80'
        >
          View All Assignments
          <ChevronRight className='size-4' />
        </Link>
      </div>

      <div className='mt-3 space-y-3'>
        {assignments.map(item => (
          <div
            key={item.id}
            className='rounded-[10px] border border-border/70 bg-background px-3 py-3'
          >
            <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
              <div className='min-w-0'>
                <div className='flex items-center gap-2'>
                  <span className='inline-flex size-7 items-center justify-center rounded-[8px] bg-[color-mix(in_srgb,var(--primary)_10%,white)] text-primary'>
                    <FileText className='size-4' />
                  </span>
                  <h3 className='truncate text-[0.98rem] font-semibold text-foreground'>{item.title}</h3>
                </div>
                <p className='mt-2 text-[0.84rem] text-muted-foreground'>{item.summary}</p>
                <div className='mt-2 flex flex-wrap items-center gap-2 text-[0.72rem] text-muted-foreground'>
                  <span>{item.dueLabel}</span>
                  <span className='size-1 rounded-full bg-border' />
                  <span>{item.statusLabel}</span>
                </div>
              </div>

              <div className='flex flex-wrap items-center gap-2'>
                <Link
                  prefetch
                  href={item.href}
                  className='inline-flex items-center justify-center rounded-[8px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--success)_80%,black_6%),color-mix(in_srgb,var(--success)_70%,black_18%))] px-4 py-2 text-[0.78rem] font-medium text-white transition hover:opacity-95'
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
