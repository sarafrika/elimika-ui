// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
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
        'border-border bg-card w-full min-w-0 overflow-hidden rounded-[12px] border',
        className
      )}
    >
      <div className='flex min-w-0 items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4'>
        <h2 className='text-foreground min-w-0 flex-1 truncate text-[1.1rem] font-semibold sm:text-[1.2rem]'>
          {title}
        </h2>

        {trailingMode === 'ellipsis' ? (
          <button
            type='button'
            aria-label={`${title} options`}
            className='text-muted-foreground hover:text-foreground shrink-0 transition'
          >
            <MoreHorizontal className='size-5' />
          </button>
        ) : null}

        {trailingMode === 'link' ? (
          <Link href={onActionHref} className='shrink-0'>
            <Button
              variant='ghost'
              className='text-primary hover:text-primary/80 h-auto gap-1 p-0 text-[0.82rem] font-medium hover:bg-transparent sm:text-sm'
            >
              {onActionLabel}
              <ChevronRight className='size-4' />
            </Button>
          </Link>
        ) : null}
      </div>

      <div className='w-full min-w-0 overflow-hidden px-3 pb-3'>{children}</div>
    </section>
  );
}
