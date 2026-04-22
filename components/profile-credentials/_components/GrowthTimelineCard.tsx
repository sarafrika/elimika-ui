'use client';

import { ChevronRight, Share2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type { GrowthItem } from '../data';

type GrowthTimelineCardProps = {
  item: GrowthItem;
};

const accentStyles = {
  green:
    'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--success)_18%,white),white)] text-success',
  amber:
    'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--el-accent-amber)_28%,white),white)] text-[color-mix(in_srgb,var(--el-accent-amber)_92%,var(--foreground))]',
  blue: 'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_18%,white),white)] text-primary',
} as const;

export function GrowthTimelineCard({ item }: GrowthTimelineCardProps) {
  const Icon = item.icon;

  return (
    <Card className='gap-4 rounded-[16px] border-white/60 bg-card/95 px-4 py-4 shadow-sm'>
      <div className='flex items-start gap-3'>
        <span
          className={cn(
            'grid size-14 shrink-0 place-items-center rounded-lg border border-white/70 shadow-sm',
            accentStyles[item.accent]
          )}
        >
          <Icon className='size-6' />
        </span>

        <div className='min-w-0 flex-1'>
          {/* <h3 className='text-foreground text-[1.1rem] font-semibold tracking-tight'>{item.title}</h3> */}
          <p className='text-muted-foreground mt-1 text-base'>{item.title}</p>
          {item.documentName ? (
            <p className='text-muted-foreground mt-1 truncate text-sm'>{item.documentName}</p>
          ) : null}
        </div>

        <Badge
          variant='secondary'
          className='rounded-lg bg-[color-mix(in_srgb,var(--primary)_8%,white)] px-3 py-1 text-primary'
        >
          {item.badge}
        </Badge>
      </div>

      <div className='flex flex-wrap gap-2'>
        <Badge
          variant='outline'
          className='rounded-lg border-white/70 bg-background/80 px-3 py-1.5 text-sm text-muted-foreground'
        >
          {item.metadata}
        </Badge>
        <Button variant='outline' size='sm' className='rounded-lg border-white/70 bg-background/80'>
          <Share2 className='size-4' />
          Share
        </Button>
      </div>

      <div className='flex flex-wrap justify-between gap-2 border-t pt-3'>
        <Badge
          variant='outline'
          className='rounded-lg border-white/70 bg-background/80 px-3 py-1.5 text-sm text-primary'
        >
          {item.footerLabel}
        </Badge>
        <Button
          asChild={!!item.documentUrl}
          variant={item.actionLabel === 'Apply New' ? 'default' : 'outline'}
          size='sm'
          className='rounded-lg'
        >
          {item.documentUrl ? (
            <a href={item.documentUrl} target='_blank' rel='noreferrer'>
              {item.actionLabel}
              <ChevronRight className='size-4' />
            </a>
          ) : (
            <>
              {item.actionLabel}
              <ChevronRight className='size-4' />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
