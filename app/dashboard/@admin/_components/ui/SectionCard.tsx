import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Right-aligned controls in the section header. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Render without the card chrome (just the header + body). */
  bare?: boolean;
}

/**
 * A titled content section with the refined card chrome. Server-safe. Pair with
 * `<Suspense fallback={<SectionCardSkeleton/>}>` so each section streams independently.
 */
export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  bare = false,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        bare ? '' : 'rounded-[18px] border border-border/70 bg-card shadow-sm',
        className
      )}
    >
      {title || actions ? (
        <div className='flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-5 py-4'>
          <div className='space-y-1'>
            {title ? <h2 className='text-base font-semibold text-foreground'>{title}</h2> : null}
            {description ? <p className='text-sm text-muted-foreground'>{description}</p> : null}
          </div>
          {actions ? <div className='flex items-center gap-2'>{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn(bare ? '' : 'p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

/** Skeleton matching the SectionCard layout — use as a `<Suspense>` fallback. */
export function SectionCardSkeleton({
  rows = 4,
  withHeader = true,
  className,
}: {
  rows?: number;
  withHeader?: boolean;
  className?: string;
}) {
  return (
    <section className={cn('rounded-[18px] border border-border/70 bg-card shadow-sm', className)}>
      {withHeader ? (
        <div className='space-y-2 border-b border-border/60 px-5 py-4'>
          <Skeleton className='h-4 w-40' />
          <Skeleton className='h-3 w-64' />
        </div>
      ) : null}
      <div className='space-y-3 p-5'>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className='h-4 w-full' style={{ width: `${90 - index * 8}%` }} />
        ))}
      </div>
    </section>
  );
}
