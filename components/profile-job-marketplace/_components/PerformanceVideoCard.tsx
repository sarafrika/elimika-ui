'use client';

import { Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type { MiniCardItem } from '../data';

type PerformanceVideoCardProps = {
  item: MiniCardItem;
};

export function PerformanceVideoCard({ item }: PerformanceVideoCardProps) {
  return (
    <Card className='gap-3 rounded-[16px] border-white/60 bg-card/95 px-4 py-4 shadow-sm'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-3'>
          <span
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-lg text-sm font-semibold text-white',
              item.accent === 'gold'
                ? 'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--el-accent-amber)_72%,var(--foreground)),color-mix(in_srgb,var(--foreground)_88%,black))]'
                : 'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_92%,var(--foreground)),color-mix(in_srgb,var(--primary)_72%,white))]'
            )}
          >
            {item.iconLabel}
          </span>
          <div className='min-w-0'>
            <h3 className='text-foreground truncate text-lg font-semibold'>{item.title}</h3>
            <p className='text-muted-foreground text-sm'>{item.subtitle}</p>
          </div>
        </div>
        <span className='inline-flex items-center gap-0.5'>
          {[1, 2, 3, 4, 5].map(index => (
            <Star
              key={index}
              className={cn(
                'size-4',
                index <= item.rating
                  ? 'fill-[color-mix(in_srgb,var(--el-accent-amber)_85%,var(--foreground))] text-[color-mix(in_srgb,var(--el-accent-amber)_85%,var(--foreground))]'
                  : 'text-muted-foreground/35'
              )}
            />
          ))}
        </span>
      </div>
      <div className='flex justify-end'>
        <Button
          variant={item.ctaLabel === 'Watch Video' ? 'default' : 'success'}
          className='rounded-xl px-5'
        >
          {item.ctaLabel}
        </Button>
      </div>
    </Card>
  );
}
