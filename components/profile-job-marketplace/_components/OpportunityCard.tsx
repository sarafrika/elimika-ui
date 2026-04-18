'use client';

import { Bookmark, MapPin, Play, Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type { JobCardItem } from '../data';

type OpportunityCardProps = {
  item: JobCardItem;
};

const artworkAccent = {
  blue:
    'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_16%,white),color-mix(in_srgb,var(--el-accent-azure)_35%,white))]',
  teal:
    'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--success)_20%,white),color-mix(in_srgb,var(--el-accent-azure)_28%,white))]',
  gold:
    'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--el-accent-amber)_26%,white),color-mix(in_srgb,var(--primary)_12%,white))]',
} as const;

const buttonVariant = {
  blue: 'default',
  teal: 'success',
  gold: 'default',
} as const;

function StarRating({ rating }: { rating: number }) {
  return (
    <span className='inline-flex items-center gap-0.5'>
      {[1, 2, 3, 4, 5].map(index => (
        <Star
          key={index}
          className={cn(
            'size-4',
            index <= rating
              ? 'fill-[color-mix(in_srgb,var(--el-accent-amber)_85%,var(--foreground))] text-[color-mix(in_srgb,var(--el-accent-amber)_85%,var(--foreground))]'
              : 'text-muted-foreground/35'
          )}
        />
      ))}
    </span>
  );
}

function OpportunityArtwork({ item }: { item: JobCardItem }) {
  const isVideo = item.type === 'video';

  return (
    <div className={cn('relative overflow-hidden rounded-[14px] border p-3', artworkAccent[item.accent])}>
      <div className='absolute top-3 left-3 grid size-7 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm'>
        <Bookmark className='size-4' />
      </div>
      {item.matchLabel ? (
        <Badge className='absolute top-3 right-3 rounded-lg bg-[color-mix(in_srgb,var(--el-accent-amber)_30%,white)] text-foreground'>
          {item.matchLabel}
        </Badge>
      ) : null}
      <div className='grid min-h-[124px] grid-cols-[1.25fr_0.8fr] gap-3 pt-5'>
        <div className='rounded-xl border bg-white/70 p-3 shadow-sm'>
          <div className='h-3 w-16 rounded-full bg-primary/20' />
          <div className='mt-3 h-14 rounded-lg bg-[color-mix(in_srgb,var(--primary)_18%,white)]' />
          <div className='mt-3 flex gap-2'>
            <div className='h-2.5 w-16 rounded-full bg-muted' />
            <div className='h-2.5 w-10 rounded-full bg-muted/70' />
          </div>
        </div>
        <div className='space-y-3'>
          <div className='h-16 rounded-xl border bg-white/70 shadow-sm' />
          <div className='h-12 rounded-xl border bg-white/70 shadow-sm' />
        </div>
      </div>
      {isVideo ? (
        <div className='absolute inset-0 grid place-items-center'>
          <span className='grid size-16 place-items-center rounded-full bg-foreground/65 text-background shadow-lg'>
            <Play className='ml-1 size-7 fill-current' />
          </span>
        </div>
      ) : null}
      {item.duration ? (
        <Badge className='absolute right-3 bottom-3 rounded-lg bg-foreground/75 text-background'>
          {item.duration}
        </Badge>
      ) : null}
    </div>
  );
}

export function OpportunityCard({ item }: OpportunityCardProps) {
  return (
    <Card className='gap-4 rounded-[18px] border-white/60 bg-card/95 px-4 py-4 shadow-sm'>
      <OpportunityArtwork item={item} />

      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          <h3 className='text-foreground text-[1.1rem] font-semibold leading-tight'>{item.title}</h3>
          <p className='text-muted-foreground mt-1 text-base'>{item.company}</p>
        </div>
        <StarRating rating={item.rating} />
      </div>

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='min-w-0'>
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            <MapPin className='text-success size-4' />
            <span>{item.locationOrMeta}</span>
          </div>
        </div>
        <Button variant={buttonVariant[item.accent]} className='rounded-xl px-5'>
          {item.ctaLabel}
        </Button>
      </div>

      <p className='text-muted-foreground text-sm leading-5'>{item.description}</p>
    </Card>
  );
}
