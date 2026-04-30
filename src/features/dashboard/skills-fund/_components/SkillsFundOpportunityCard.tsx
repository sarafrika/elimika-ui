'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, Info, Star } from 'lucide-react';
import type { SkillsFundOpportunity } from '../data';

const accentStyles = {
  amber: {
    artwork: 'from-warning/15 via-orange-50 to-warning/15',
    bubble: 'bg-warning/80',
    chip: 'bg-warning/10 text-warning',
  },
  blue: {
    artwork: 'from-primary/15 via-primary/5 to-primary/15',
    bubble: 'bg-primary/40',
    chip: 'bg-success/10 text-success',
  },
  sky: {
    artwork: 'from-primary/20 via-primary/10 to-primary/15',
    bubble: 'bg-primary/40',
    chip: 'bg-success/10 text-success',
  },
  violet: {
    artwork: 'from-accent/40 via-accent/20 to-primary/15',
    bubble: 'bg-accent',
    chip: 'bg-warning/10 text-warning',
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
          'relative h-[110px] overflow-hidden border-b border-border bg-gradient-to-r sm:h-[122px]',
          tones.artwork
        )}
        aria-hidden='true'
      >
      <div className='absolute left-4 top-5 h-16 w-14 rounded-[8px] border border-border/70 bg-card/80 shadow-sm' />
      <div className='absolute left-10 top-9 h-12 w-20 rounded-[10px] border border-border/70 bg-card/75 shadow-sm' />
      <div className='absolute right-4 top-4 h-16 w-24 rounded-[10px] border border-border/70 bg-card/75 shadow-sm' />
      <div className='absolute right-16 top-7 h-14 w-16 rounded-[8px] border border-border/70 bg-card/80 shadow-sm' />
      <div className={cn('absolute bottom-4 left-16 h-8 w-8 rounded-full', tones.bubble)} />
      <div className='absolute bottom-3 right-6 h-4 w-4 rounded-full bg-card/90' />
    </div>
  );
}

export function SkillsFundOpportunityCard({ opportunity }: SkillsFundOpportunityCardProps) {
  const tones = accentStyles[opportunity.accent];

  return (
    <article className='w-full max-w-[450px] overflow-hidden rounded-[12px] border border-border bg-card shadow-sm'>
      <OpportunityArtwork accent={opportunity.accent} />

      <div className='space-y-3 px-3 py-3 sm:px-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-foreground'>
                {opportunity.sponsor.charAt(0)}
              </div>
              <h2 className='truncate text-[1.15rem] font-semibold leading-tight text-foreground sm:text-[1.3rem]'>
                {opportunity.title}
              </h2>
            </div>
            <p className='mt-1 text-sm text-muted-foreground sm:text-[0.98rem]'>{opportunity.organisation}</p>
          </div>

          <div className='flex shrink-0 items-center gap-0.5 pt-1'>
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={`${opportunity.id}-star-${index + 1}`}
                className={cn(
                  'size-4',
                  index < opportunity.rating
                    ? 'fill-warning text-warning'
                    : 'fill-muted text-muted'
                )}
              />
            ))}
          </div>
        </div>

        <div className='space-y-1.5 text-sm text-foreground sm:text-[0.95rem]'>
          <p className='font-medium'>{opportunity.amountLabel}</p>
          {opportunity.location ? (
            <p className='text-muted-foreground'>{opportunity.location}</p>
          ) : (
            <p className='text-muted-foreground'>{opportunity.description}</p>
          )}
        </div>

        <div className='flex flex-wrap items-center gap-2 text-[0.78rem] font-medium sm:text-[0.82rem]'>
          <span className={cn('rounded-[4px] px-2 py-1', tones.chip)}>{opportunity.recommendation}</span>
          {opportunity.footerMeta ? (
            <span className='rounded-[4px] bg-muted px-2 py-1 text-muted-foreground'>
              {opportunity.footerMeta}
            </span>
          ) : null}
          {opportunity.eyebrow ? (
            <span className='rounded-[4px] bg-warning/10 px-2 py-1 text-warning'>
              {opportunity.eyebrow}
            </span>
          ) : null}
        </div>

        <div className='space-y-2 border-t border-border pt-3'>
          <div className='flex items-center justify-between text-[0.85rem] font-semibold text-foreground'>
            <span className='inline-flex items-center gap-1'>
              Fund Usage
              <Info className='size-3.5 text-muted-foreground' />
            </span>
            <span>{opportunity.usageLabel}</span>
          </div>

          <div className='h-2 overflow-hidden rounded-full bg-muted'>
            <div className='h-full rounded-full bg-primary' style={{ width: `${opportunity.usagePercent}%` }} />
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2 pt-1'>
          <span className='inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[0.78rem] font-medium text-success'>
            <CheckCircle2 className='size-3.5' />
            {opportunity.eligibilityLabel}
          </span>
          <Button className='h-8 rounded-[6px] px-4 text-[0.82rem]'>
            {opportunity.actionLabel}
          </Button>
          <Button
            variant='outline'
            className='h-8 rounded-[6px] px-3 text-[0.82rem]'
          >
            {opportunity.secondaryActionLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}
