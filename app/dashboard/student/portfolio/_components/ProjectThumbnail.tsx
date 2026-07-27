import { Play, Search } from 'lucide-react';

import { cn } from '@/lib/utils';

type ProjectThumbnailProps = {
  variant: 'document' | 'video' | 'presentation';
  compact?: boolean;
};

export function ProjectThumbnail({ variant, compact }: ProjectThumbnailProps) {
  const isVideo = variant === 'video';
  const isPresentation = variant === 'presentation';

  return (
    <div
      className={cn(
        'bg-secondary relative overflow-hidden rounded-md border shadow-inner',
        compact ? 'h-24 w-full sm:h-28' : 'h-28 w-full sm:h-[118px]'
      )}
      aria-hidden='true'
    >
      <div className='absolute inset-0 bg-[linear-gradient(135deg,var(--el-accent-azure),var(--el-brand-100)_52%,var(--el-neutral-0))]' />
      <div className='bg-card absolute top-3 left-3 h-[72%] w-[58%] rounded-sm shadow-sm'>
        <div className='h-4 rounded-t-sm bg-[color-mix(in_srgb,var(--primary)_62%,var(--el-accent-azure))]' />
        <div className='space-y-2 p-2'>
          <div className='bg-muted h-2 w-3/4 rounded-full' />
          <div className='h-2 w-1/2 rounded-full bg-[color-mix(in_srgb,var(--el-accent-amber)_75%,var(--card))]' />
          <div className='bg-muted h-2 w-2/3 rounded-full' />
          <div className='h-2 w-1/3 rounded-full bg-[color-mix(in_srgb,var(--success)_55%,var(--card))]' />
        </div>
      </div>
      <div className='bg-card absolute right-4 bottom-3 h-[58%] w-[45%] rounded-sm shadow-md'>
        <div className='h-3 rounded-t-sm bg-[color-mix(in_srgb,var(--primary)_72%,var(--card))]' />
        <div className='space-y-1.5 p-2'>
          <div className='bg-muted h-1.5 w-4/5 rounded-full' />
          <div className='bg-muted h-1.5 w-3/5 rounded-full' />
          <div className='h-1.5 w-2/3 rounded-full bg-[color-mix(in_srgb,var(--el-accent-amber)_70%,var(--card))]' />
        </div>
      </div>
      <div className='text-primary-foreground absolute top-8 left-5 grid size-7 place-items-center rounded-sm bg-[color-mix(in_srgb,var(--primary)_80%,var(--card))]'>
        <span className='text-base leading-none'>+</span>
      </div>
      {isPresentation ? (
        <div className='absolute top-5 right-5 flex gap-1'>
          {[0, 1, 2].map(item => (
            <span key={item} className='bg-primary/60 size-2 rounded-full' />
          ))}
        </div>
      ) : null}
      <Search className='text-card absolute top-3 right-3 size-4' />
      {isVideo ? (
        <div className='bg-foreground/10 absolute inset-0 grid place-items-center'>
          <span className='bg-foreground/65 text-background grid size-12 place-items-center rounded-full shadow-lg'>
            <Play className='ml-0.5 size-6 fill-current' />
          </span>
        </div>
      ) : null}
    </div>
  );
}
