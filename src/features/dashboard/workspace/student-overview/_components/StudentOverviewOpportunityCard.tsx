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
    <Card className='rounded-[16px] border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(247,249,255,0.95))] p-2.5 shadow-[0_30px_60px_-48px_rgba(37,99,235,0.45)]'>
      <div className='flex items-start gap-3'>
        <div className='grid size-10 shrink-0 place-items-center rounded-[10px] bg-[linear-gradient(180deg,#4d97ff,#2a6fdd)] text-white shadow-sm'>
          <BriefcaseBusiness className='size-4.5' />
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h3 className='truncate text-[0.98rem] font-semibold text-slate-900'>{opportunity.title}</h3>
              <p className='mt-0.5 text-[0.84rem] text-slate-700'>{opportunity.company}</p>
              <p className='text-[0.74rem] text-slate-500'>{opportunity.location}</p>
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.66rem] font-medium ${
                opportunity.badgeTone === 'teal'
                  ? 'bg-[color-mix(in_srgb,var(--success)_14%,white)] text-slate-600'
                  : 'bg-[color-mix(in_srgb,var(--warning)_16%,white)] text-slate-600'
              }`}
            >
              <Sparkles className='size-3' />
              {opportunity.badge}
            </span>
          </div>

          <div className='mt-2.5 flex flex-wrap items-end justify-between gap-2.5'>
            <div className='space-y-1.5'>
              <div className='text-[1.7rem] leading-none font-semibold tracking-tight text-slate-900'>
                {opportunity.match}%
              </div>
              <div className='inline-flex rounded-[9px] bg-[color-mix(in_srgb,var(--primary)_10%,white)] px-2 py-1 text-[0.66rem] font-medium text-slate-600'>
                {opportunity.footer}
              </div>
            </div>

            <Link
              prefetch
              href='/dashboard/job-marketplace'
              className='inline-flex items-center gap-1 rounded-[8px] bg-primary px-3 py-1.5 text-[0.76rem] font-medium text-primary-foreground transition hover:bg-primary/90'
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
