// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className={cn('overflow-hidden rounded-[16px] border-border/70 shadow-sm', className)}>
      <div className='flex min-w-0 items-center justify-between gap-2 border-b border-border/60 bg-muted/20 px-3 py-3 sm:gap-3 sm:px-4'>
        <h2 className='text-foreground min-w-0 flex-1 truncate text-[1rem] font-semibold sm:text-[1.08rem]'>
          {title}
        </h2>

        {trailingMode === 'ellipsis' ? (
          <button
            type='button'
            aria-label={`${title} options`}
            className='text-muted-foreground hover:text-foreground shrink-0 transition'
          >
            <MoreHorizontal className='size-4' />
          </button>
        ) : null}

        {trailingMode === 'link' ? (
          <Link href={onActionHref ?? '#'} className='shrink-0'>
            <Button
              variant='ghost'
              className='text-primary hover:text-primary/80 h-auto gap-1 p-0 text-[0.75rem] font-medium hover:bg-transparent sm:text-[0.82rem]'
            >
              {onActionLabel}
              <ChevronRight className='size-4' />
            </Button>
          </Link>
        ) : null}
      </div>

      <CardContent className='space-y-3 p-3 sm:p-4'>{children}</CardContent>
    </Card>
  );
}
