import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Right-aligned controls in the header. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Drop the card chrome and keep only the header and body. */
  bare?: boolean;
}

/** A titled section. Server-safe, so it can paint before its data arrives. */
export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  bare = false,
}: SectionCardProps) {
  const hasHeader = Boolean(title || actions || description);

  return (
    <section className={cn(bare ? '' : 'border-border/70 bg-card rounded-md border', className)}>
      {hasHeader ? (
        <div className='border-border/60 flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4'>
          <div className='space-y-1'>
            {title ? <h2 className='text-foreground text-base font-semibold'>{title}</h2> : null}
            {description ? <p className='text-muted-foreground text-sm'>{description}</p> : null}
          </div>
          {actions ? <div className='flex items-center gap-2'>{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn(bare ? '' : 'p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

/** Matching skeleton, sized like the loaded section. */
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
    <section className={cn('border-border/70 bg-card rounded-md border', className)}>
      {withHeader ? (
        <div className='border-border/60 space-y-2 border-b px-5 py-4'>
          <Skeleton className='h-4 w-40' />
          <Skeleton className='h-3 w-64' />
        </div>
      ) : null}
      <div className='space-y-3 p-5'>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className='h-4' style={{ width: `${90 - index * 8}%` }} />
        ))}
      </div>
    </section>
  );
}
