'use client';

import { ChevronRight, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import type { GrowthItem } from '../data';
import { GrowthTimelineCard } from './GrowthTimelineCard';

type GrowthTimelineSectionProps = {
  items: GrowthItem[];
};

export function GrowthTimelineSection({ items }: GrowthTimelineSectionProps) {
  return (
    <Card className='rounded-[18px] border-white/60 bg-card/95 px-4 py-4 shadow-sm sm:px-5 mb-20'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h2 className='text-foreground text-2xl font-semibold tracking-tight'>Growth Timeline</h2>
        <Button variant='ghost' className='rounded-xl text-primary'>
          View Full Timeline
          <ChevronRight className='size-4' />
        </Button>
      </div>

      {items.length > 0 ? (
        <div className='grid gap-4 md:grid-cols-2 2xl:grid-cols-3'>
          {items.map(item => (
            <GrowthTimelineCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className='min-h-[340px] py-2'>
          <div className='border-border/60 bg-background/80 flex h-full min-h-[340px] flex-col items-center justify-center rounded-[18px] border border-dashed px-6 py-10 text-center'>
            <div className='bg-primary/10 text-primary mb-4 grid size-14 place-items-center rounded-full'>
              <Sparkles className='size-7' />
            </div>
            <div className='space-y-2'>
              <h3 className='text-foreground text-xl font-semibold'>No growth activity yet</h3>
              <p className='text-muted-foreground max-w-md text-sm leading-6'>
                As documents are uploaded and verified, the growth timeline will populate here.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
