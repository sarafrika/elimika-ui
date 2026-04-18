'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, Info, Star } from 'lucide-react';
import type { SkillsFundOpportunity } from '../data';

const accentStyles = {
  amber: {
    artwork: 'from-amber-100 via-orange-50 to-amber-100',
    bubble: 'bg-amber-300/80',
    chip: 'bg-amber-50 text-amber-700',
  },
  blue: {
    artwork: 'from-blue-100 via-sky-50 to-indigo-100',
    bubble: 'bg-blue-300/80',
    chip: 'bg-green-50 text-green-700',
  },
  sky: {
    artwork: 'from-sky-100 via-blue-50 to-cyan-100',
    bubble: 'bg-sky-300/80',
    chip: 'bg-green-50 text-green-700',
  },
  violet: {
    artwork: 'from-violet-100 via-indigo-50 to-blue-100',
    bubble: 'bg-violet-300/80',
    chip: 'bg-amber-50 text-amber-700',
  },
} as const;

type SkillsFundOpportunityCardProps = {
  opportunity: SkillsFundOpportunity;
};

function OpportunityArtwork({ accent }: Pick<SkillsFundOpportunity, 'accent'>) {
  const tones = accentStyles[accent];

  return (
    <div
      className={cn(
        'relative h-[110px] overflow-hidden border-b border-slate-200 bg-gradient-to-r sm:h-[122px]',
        tones.artwork
      )}
      aria-hidden='true'
    >
      <div className='absolute left-4 top-5 h-16 w-14 rounded-[8px] border border-white/90 bg-white/80 shadow-sm' />
      <div className='absolute left-10 top-9 h-12 w-20 rounded-[10px] border border-white/80 bg-white/75 shadow-sm' />
      <div className='absolute right-4 top-4 h-16 w-24 rounded-[10px] border border-white/80 bg-white/75 shadow-sm' />
      <div className='absolute right-16 top-7 h-14 w-16 rounded-[8px] border border-white/80 bg-white/80 shadow-sm' />
      <div className={cn('absolute bottom-4 left-16 h-8 w-8 rounded-full', tones.bubble)} />
      <div className='absolute bottom-3 right-6 h-4 w-4 rounded-full bg-white/90' />
    </div>
  );
}

export function SkillsFundOpportunityCard({ opportunity }: SkillsFundOpportunityCardProps) {
  const tones = accentStyles[opportunity.accent];

  return (
    <article className='w-full max-w-[450px] overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.04)]'>
      <OpportunityArtwork accent={opportunity.accent} />

      <div className='space-y-3 px-3 py-3 sm:px-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700'>
                {opportunity.sponsor.charAt(0)}
              </div>
              <h2 className='truncate text-[1.15rem] font-semibold leading-tight text-slate-900 sm:text-[1.3rem]'>
                {opportunity.title}
              </h2>
            </div>
            <p className='mt-1 text-sm text-slate-500 sm:text-[0.98rem]'>{opportunity.organisation}</p>
          </div>

          <div className='flex shrink-0 items-center gap-0.5 pt-1'>
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={`${opportunity.id}-star-${index + 1}`}
                className={cn(
                  'size-4',
                  index < opportunity.rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-slate-200 text-slate-200'
                )}
              />
            ))}
          </div>
        </div>

        <div className='space-y-1.5 text-sm text-slate-700 sm:text-[0.95rem]'>
          <p className='font-medium'>{opportunity.amountLabel}</p>
          {opportunity.location ? (
            <p className='text-slate-500'>{opportunity.location}</p>
          ) : (
            <p className='text-slate-500'>{opportunity.description}</p>
          )}
        </div>

        <div className='flex flex-wrap items-center gap-2 text-[0.78rem] font-medium sm:text-[0.82rem]'>
          <span className={cn('rounded-[4px] px-2 py-1', tones.chip)}>{opportunity.recommendation}</span>
          {opportunity.footerMeta ? (
            <span className='rounded-[4px] bg-slate-100 px-2 py-1 text-slate-500'>
              {opportunity.footerMeta}
            </span>
          ) : null}
          {opportunity.eyebrow ? (
            <span className='rounded-[4px] bg-amber-50 px-2 py-1 text-amber-700'>{opportunity.eyebrow}</span>
          ) : null}
        </div>

        <div className='space-y-2 border-t border-slate-200 pt-3'>
          <div className='flex items-center justify-between text-[0.85rem] font-semibold text-slate-700'>
            <span className='inline-flex items-center gap-1'>
              Fund Usage
              <Info className='size-3.5 text-slate-400' />
            </span>
            <span>{opportunity.usageLabel}</span>
          </div>

          <div className='h-2 overflow-hidden rounded-full bg-slate-100'>
            <div className='h-full rounded-full bg-blue-500' style={{ width: `${opportunity.usagePercent}%` }} />
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2 pt-1'>
          <span className='inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[0.78rem] font-medium text-green-700'>
            <CheckCircle2 className='size-3.5' />
            {opportunity.eligibilityLabel}
          </span>
          <Button className='h-8 rounded-[6px] bg-blue-600 px-4 text-[0.82rem] hover:bg-blue-700'>
            {opportunity.actionLabel}
          </Button>
          <Button
            variant='outline'
            className='h-8 rounded-[6px] border-slate-300 px-3 text-[0.82rem] text-slate-700 hover:bg-slate-50'
          >
            {opportunity.secondaryActionLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}
