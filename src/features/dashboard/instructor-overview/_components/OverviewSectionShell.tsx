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
    <section className={cn('rounded-[12px] border border-border bg-card', className)}>
      <div className='flex items-center justify-between gap-3 px-4 py-3'>
        <h2 className='text-[1.15rem] font-semibold text-foreground sm:text-[1.2rem]'>{title}</h2>
        {trailingMode === 'ellipsis' ? (
          <button
            type='button'
            aria-label={`${title} options`}
            className='text-muted-foreground transition hover:text-foreground'
          >
            <MoreHorizontal className='size-5' />
          </button>
        ) : null}
        {trailingMode === 'link' ? (
          <Link href={onActionHref}>
            <Button
              variant='ghost'
              className='h-auto p-0 text-sm font-medium text-primary hover:bg-transparent hover:text-primary/80'
            >
              {onActionLabel}
              <ChevronRight className='ml-1 size-4' />
            </Button>
          </Link>
        ) : null}
      </div>
      <div className='px-3 pb-3'>{children}</div>
    </section>
  );
}
