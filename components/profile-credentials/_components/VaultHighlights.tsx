'use client';

import { ChevronDown, ChevronRight, Eye, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type VaultHighlightsProps = {
  badges: string;
  blockchain: string;
  shares: string;
};

export function VaultHighlights({
  badges,
  blockchain,
  shares,
}: VaultHighlightsProps) {
  return (
    <div className='flex flex-wrap gap-3'>
      <Card className='min-w-[180px] flex-1 rounded-[16px] border-white/60 bg-card/95 px-5 py-4 shadow-sm'>
        <div className='flex items-center gap-2 text-lg font-semibold'>
          <span className='text-primary'>⊞</span>
          {badges}
        </div>
      </Card>

      <Card className='min-w-[240px] flex-[1.2] rounded-[16px] border-white/60 bg-card/95 px-5 py-4 shadow-sm'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-2 text-base font-medium'>
            <Eye className='text-success size-4' />
            {blockchain}
          </div>
          <ChevronRight className='text-muted-foreground size-4' />
        </div>
      </Card>

      <Card className='min-w-[220px] flex-1 rounded-[16px] border-white/60 bg-card/95 px-4 py-3 shadow-sm'>
        <div className='flex flex-wrap items-center gap-2 xl:justify-between'>
          <div className='flex items-center gap-2 text-lg font-semibold'>
            <span className='text-primary'>⊟</span>
            {shares}
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Button variant='outline' size='sm' className='rounded-xl border-white/70 bg-background/80'>
              <SlidersHorizontal className='size-4' />
              Filter
            </Button>
            <Button variant='outline' size='icon' className='rounded-lg border-white/70 bg-background/80'>
              <ChevronDown className='size-4' />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
