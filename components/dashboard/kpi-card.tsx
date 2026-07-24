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
        green: 'border-l-4 border-l-emerald-600',
        coral: 'border-l-4 border-l-orange-500',
        amber: 'border-l-4 border-l-amber-500',
        indigo: 'border-l-4 border-l-indigo-500',
      },
    },
    defaultVariants: { variant: 'primary' },
  }
);

const iconVariants: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  green: 'bg-emerald-500/10 text-emerald-600',
  coral: 'bg-orange-500/10 text-orange-600',
  amber: 'bg-amber-500/10 text-amber-600',
  indigo: 'bg-indigo-500/10 text-indigo-600',
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
    <Card className={cn(kpiCardVariants({ variant }), href && 'cursor-pointer', className)}>
      <CardHeader className='relative flex flex-row items-start justify-between pb-2'>
        <span className='text-sm font-medium text-muted-foreground'>{title}</span>
        <div className={cn('rounded-lg p-2', iconVariants[v])}>{icon}</div>
      </CardHeader>
      <CardContent className='relative'>
        <div className='text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>{value}</div>
        {(change || hint) && (
          <div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
            {change && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                  changeType === 'up'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-rose-500/10 text-rose-600'
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
    <Card className={cn('relative overflow-hidden border-l-4 border-l-muted', className)}>
      <CardHeader className='flex flex-row items-start justify-between pb-2'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-9 w-9 rounded-lg' />
      </CardHeader>
      <CardContent>
        <Skeleton className='h-8 w-20' />
        <Skeleton className='mt-2 h-3 w-28' />
      </CardContent>
    </Card>
  );
}
