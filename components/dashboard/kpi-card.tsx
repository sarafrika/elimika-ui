import { cva, type VariantProps } from 'class-variance-authority';
import { ArrowDown, ArrowUp } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Presentational KPI tile ported from the Lovable design system. It never fetches
 * data — a container passes `value`, `change`, etc. as props. Fully fluid so it
 * scales cleanly inside 2xl / ultrawide grids.
 */
const kpiCardVariants = cva(
  'relative overflow-hidden border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
  {
    variants: {
      variant: {
        primary: 'border-l-4 border-l-primary',
        green: 'border-l-4 border-l-success',
        coral: 'border-l-4 border-l-orange-500',
        amber: 'border-l-4 border-l-warning',
        indigo: 'border-l-4 border-l-primary',
      },
    },
    defaultVariants: { variant: 'primary' },
  }
);

const iconVariants: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  green: 'bg-success/10 text-success',
  coral: 'bg-orange-500/10 text-orange-600',
  amber: 'bg-warning/10 text-warning',
  indigo: 'bg-primary/10 text-primary',
};

export type KpiCardVariant = NonNullable<VariantProps<typeof kpiCardVariants>['variant']>;

export interface KpiCardProps extends VariantProps<typeof kpiCardVariants> {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  /** Optional trend delta, e.g. "1.19%". Hidden when omitted. */
  change?: string;
  changeType?: 'up' | 'down';
  hint?: string;
  /** When provided the whole card becomes a link. */
  href?: string;
  className?: string;
}

export function KpiCard({
  title,
  value,
  change,
  changeType = 'up',
  icon,
  variant,
  hint,
  href,
  className,
}: KpiCardProps) {
  const v = variant ?? 'primary';
  const card = (
    <Card
      className={cn(
        kpiCardVariants({ variant }),
        'gap-1 py-4',
        href && 'cursor-pointer',
        className
      )}
    >
      <CardHeader className='relative flex flex-row items-center justify-between pb-0'>
        <span className='text-[13px] font-medium text-muted-foreground'>{title}</span>
        <div className={cn('rounded-md p-1.5', iconVariants[v])}>{icon}</div>
      </CardHeader>
      <CardContent className='relative'>
        <div className='text-2xl font-bold tracking-tight text-foreground'>{value}</div>
        {(change || hint) && (
          <div className='mt-1 flex flex-wrap items-center gap-1.5'>
            {change && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                  changeType === 'up'
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
                )}
              >
                {changeType === 'up' ? (
                  <ArrowUp className='h-3 w-3' />
                ) : (
                  <ArrowDown className='h-3 w-3' />
                )}
                {change}
              </span>
            )}
            {hint ? <span className='text-[11px] text-muted-foreground'>{hint}</span> : null}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className='block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl'>
        {card}
      </Link>
    );
  }
  return card;
}

export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('relative gap-1 overflow-hidden border-l-4 border-l-muted py-4', className)}>
      <CardHeader className='flex flex-row items-center justify-between pb-0'>
        <Skeleton className='h-3.5 w-24' />
        <Skeleton className='h-8 w-8 rounded-md' />
      </CardHeader>
      <CardContent>
        <Skeleton className='h-7 w-20' />
        <Skeleton className='mt-1.5 h-3 w-28' />
      </CardContent>
    </Card>
  );
}
