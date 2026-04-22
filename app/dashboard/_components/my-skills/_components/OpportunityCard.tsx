import { ArrowRight, BriefcaseBusiness } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { SharedOpportunity } from '../types';

type OpportunityCardProps = {
  opportunity: SharedOpportunity;
};

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const content = (
    <>
      Apply Now
      <ArrowRight className='size-3.5' />
    </>
  );

  return (
    <article className='border-border/60 bg-card grid min-h-28 grid-rows-[1fr_auto] gap-3 rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-md'>
      <div className='min-w-0'>
        <div className='mb-2 flex items-start justify-between gap-3'>
          <div className='bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-md'>
            <BriefcaseBusiness className='size-4' />
          </div>
          <Badge variant='outline' className='rounded-md text-[10px]'>
            {opportunity.match}% Match
          </Badge>
        </div>
        <h3 className='text-foreground line-clamp-2 text-sm font-semibold sm:text-base'>
          {opportunity.title}
        </h3>
        <p className='text-muted-foreground mt-1 truncate text-xs'>{opportunity.provider}</p>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='bg-muted text-muted-foreground rounded-md px-2 py-1 text-[10px]'>
          {opportunity.mode}
        </span>
        {opportunity.href ? (
          <Button asChild size='sm' className='h-7 rounded-md text-xs'>
            <Link href={opportunity.href}>{content}</Link>
          </Button>
        ) : (
          <Button type='button' size='sm' className='h-7 rounded-md text-xs'>
            {content}
          </Button>
        )}
      </div>
    </article>
  );
}
