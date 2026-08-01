'use client';

import { ArrowRight, BriefcaseBusiness, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import type { StudentOverviewOpportunity } from '../useStudentOverviewData';

type StudentOverviewOpportunityCardProps = {
  opportunity: StudentOverviewOpportunity;
};

export function StudentOverviewOpportunityCard({
  opportunity,
}: StudentOverviewOpportunityCardProps) {
  return (
    <Card className='border-border/70 rounded-[16px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_98%,white),color-mix(in_srgb,var(--muted)_20%,var(--card)))] p-2.5 shadow-[0_30px_60px_-48px_rgba(37,99,235,0.24)]'>
      <div className='flex items-start gap-3'>
        <div className='text-primary-foreground grid size-10 shrink-0 place-items-center rounded-[10px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_86%,white),color-mix(in_srgb,var(--primary)_68%,black_6%))] shadow-sm'>
          <BriefcaseBusiness className='size-4.5' />
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h3 className='text-foreground truncate text-[0.98rem] font-semibold'>
                {opportunity.title}
              </h3>
              <p className='text-muted-foreground mt-0.5 text-[0.84rem]'>{opportunity.company}</p>
              <p className='text-muted-foreground text-[0.74rem]'>{opportunity.location}</p>
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.66rem] font-medium ${
                opportunity.badgeTone === 'teal'
                  ? 'bg-success/10 text-muted-foreground'
                  : 'bg-warning/10 text-muted-foreground'
              }`}
            >
              <Sparkles className='size-3' />
              {opportunity.badge}
            </span>
          </div>

          <div className='mt-2.5 flex flex-wrap items-end justify-between gap-2.5'>
            <div className='space-y-1.5'>
              <div className='text-foreground text-[1.7rem] leading-none font-semibold tracking-tight'>
                {opportunity.match}%
              </div>
              <div className='bg-primary/10 text-muted-foreground inline-flex rounded-[9px] px-2 py-1 text-[0.66rem] font-medium'>
                {opportunity.footer}
              </div>
            </div>

            <Link
              prefetch
              href='/dashboard/job-marketplace'
              className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1 rounded-[8px] px-3 py-1.5 text-[0.76rem] font-medium transition'
            >
              Apply Now
              <ArrowRight className='size-3.5' />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
