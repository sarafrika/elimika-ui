'use client';

import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import type { GrowthItem } from '../data';
import { GrowthTimelineCard } from './GrowthTimelineCard';

type GrowthTimelineSectionProps = {
  items: GrowthItem[];
};

export function GrowthTimelineSection({ items }: GrowthTimelineSectionProps) {
  return (
    <Card className='rounded-[18px] border-white/60 bg-card/95 px-4 py-4 shadow-sm sm:px-5'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h2 className='text-foreground text-3xl font-semibold tracking-tight'>Growth Timeline</h2>
        <Button variant='ghost' className='rounded-xl text-primary'>
          View Full Timeline
          <ChevronRight className='size-4' />
        </Button>
      </div>

      <div className='grid gap-4 md:grid-cols-2 2xl:grid-cols-3'>
        {items.map(item => (
          <GrowthTimelineCard key={item.id} item={item} />
        ))}
      </div>
    </Card>
  );
}
