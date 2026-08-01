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
        'border-border relative h-[110px] overflow-hidden border-b bg-gradient-to-r sm:h-[122px]',
        tones.artwork
      )}
      aria-hidden='true'
    >
      <div className='border-border/70 bg-card/80 absolute top-5 left-4 h-16 w-14 rounded-[8px] border shadow-sm' />
      <div className='border-border/70 bg-card/75 absolute top-9 left-10 h-12 w-20 rounded-[10px] border shadow-sm' />
      <div className='border-border/70 bg-card/75 absolute top-4 right-4 h-16 w-24 rounded-[10px] border shadow-sm' />
      <div className='border-border/70 bg-card/80 absolute top-7 right-16 h-14 w-16 rounded-[8px] border shadow-sm' />
      <div className={cn('absolute bottom-4 left-16 h-8 w-8 rounded-full', tones.bubble)} />
      <div className='bg-card/90 absolute right-6 bottom-3 h-4 w-4 rounded-full' />
    </div>
  );
}

export function SkillsFundOpportunityCard({ opportunity }: SkillsFundOpportunityCardProps) {
  const tones = accentStyles[opportunity.accent];

  return (
    <article className='border-border bg-card w-full max-w-[450px] overflow-hidden rounded-[12px] border shadow-sm'>
      <OpportunityArtwork accent={opportunity.accent} />

      <div className='space-y-3 px-3 py-3 sm:px-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <div className='border-border bg-muted text-foreground flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold'>
                {opportunity.sponsor.charAt(0)}
              </div>
              <h2 className='text-foreground truncate text-[1.15rem] leading-tight font-semibold sm:text-[1.3rem]'>
                {opportunity.title}
              </h2>
            </div>
            <p className='text-muted-foreground mt-1 text-sm sm:text-[0.98rem]'>
              {opportunity.organisation}
            </p>
          </div>

          <div className='flex shrink-0 items-center gap-0.5 pt-1'>
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={`${opportunity.id}-star-${index + 1}`}
                className={cn(
                  'size-4',
                  index < opportunity.rating ? 'fill-warning text-warning' : 'fill-muted text-muted'
                )}
              />
            ))}
          </div>
        </div>

        <div className='text-foreground space-y-1.5 text-sm sm:text-[0.95rem]'>
          <p className='font-medium'>{opportunity.amountLabel}</p>
          {opportunity.location ? (
            <p className='text-muted-foreground'>{opportunity.location}</p>
          ) : (
            <p className='text-muted-foreground'>{opportunity.description}</p>
          )}
        </div>

        <div className='flex flex-wrap items-center gap-2 text-[0.78rem] font-medium sm:text-[0.82rem]'>
          <span className={cn('rounded-[4px] px-2 py-1', tones.chip)}>
            {opportunity.recommendation}
          </span>
          {opportunity.footerMeta ? (
            <span className='bg-muted text-muted-foreground rounded-[4px] px-2 py-1'>
              {opportunity.footerMeta}
            </span>
          ) : null}
          {opportunity.eyebrow ? (
            <span className='bg-warning/10 text-warning rounded-[4px] px-2 py-1'>
              {opportunity.eyebrow}
            </span>
          ) : null}
        </div>

        <div className='border-border space-y-2 border-t pt-3'>
          <div className='text-foreground flex items-center justify-between text-[0.85rem] font-semibold'>
            <span className='inline-flex items-center gap-1'>
              Fund Usage
              <Info className='text-muted-foreground size-3.5' />
            </span>
            <span>{opportunity.usageLabel}</span>
          </div>

          <div className='bg-muted h-2 overflow-hidden rounded-full'>
            <div
              className='bg-primary h-full rounded-full'
              style={{ width: `${opportunity.usagePercent}%` }}
            />
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2 pt-1'>
          <span className='bg-success/10 text-success inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.78rem] font-medium'>
            <CheckCircle2 className='size-3.5' />
            {opportunity.eligibilityLabel}
          </span>
          <Button className='h-8 rounded-[6px] px-4 text-[0.82rem]'>
            {opportunity.actionLabel}
          </Button>
          <Button variant='outline' className='h-8 rounded-[6px] px-3 text-[0.82rem]'>
            {opportunity.secondaryActionLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}
