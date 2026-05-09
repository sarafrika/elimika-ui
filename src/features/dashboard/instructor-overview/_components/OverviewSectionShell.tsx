import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

type OverviewSectionShellProps = {
  children: React.ReactNode;
  className?: string;
  onActionHref?: string;
  onActionLabel?: string;
  title: string;
  trailingMode?: 'ellipsis' | 'link' | 'none';
};

export function OverviewSectionShell({
  children,
  className,
  onActionHref,
  onActionLabel = 'See All',
  title,
  trailingMode = 'link',
}: OverviewSectionShellProps) {
  return (
    <section
      className={cn(
        'w-full min-w-0 overflow-hidden rounded-[12px] border border-border bg-card',
        className
      )}
    >
      <div className='flex min-w-0 items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4'>
        <h2 className='min-w-0 flex-1 truncate text-[1.1rem] font-semibold text-foreground sm:text-[1.2rem]'>
          {title}
        </h2>

        {trailingMode === 'ellipsis' ? (
          <button
            type='button'
            aria-label={`${title} options`}
            className='shrink-0 text-muted-foreground transition hover:text-foreground'
          >
            <MoreHorizontal className='size-5' />
          </button>
        ) : null}

        {trailingMode === 'link' ? (
          <Link href={onActionHref} className='shrink-0'>
            <Button
              variant='ghost'
              className='h-auto gap-1 p-0 text-[0.82rem] font-medium text-primary hover:bg-transparent hover:text-primary/80 sm:text-sm'
            >
              {onActionLabel}
              <ChevronRight className='size-4' />
            </Button>
          </Link>
        ) : null}
      </div>

      <div className='w-full min-w-0 overflow-hidden px-3 pb-3'>
        {children}
      </div>
    </section>
  );
}
