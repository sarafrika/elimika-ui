import type { ComponentType, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { type StatusTone, statusToneClass } from './admin-theme';

interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Small caption under the value (e.g. trend, sublabel). */
  hint?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  /** Tone for the icon chip. */
  tone?: StatusTone;
  className?: string;
}

/** Refined KPI card. Server-safe. */
export function StatCard({ label, value, hint, icon: Icon, tone = 'info', className }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-[18px] border border-border/70 bg-card p-5 shadow-sm',
        className
      )}
    >
      <div className='min-w-0 space-y-1'>
        <p className='truncate text-xs font-medium uppercase tracking-wide text-muted-foreground'>
          {label}
        </p>
        <p className='text-2xl font-semibold text-foreground'>{value}</p>
        {hint ? <p className='text-xs text-muted-foreground'>{hint}</p> : null}
      </div>
      {Icon ? (
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl border',
            statusToneClass[tone]
          )}
        >
          <Icon className='size-5' />
        </span>
      ) : null}
    </div>
  );
}

/** Skeleton matching the StatCard layout. */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-[18px] border border-border/70 bg-card p-5 shadow-sm',
        className
      )}
    >
      <div className='w-full space-y-2'>
        <Skeleton className='h-3 w-24' />
        <Skeleton className='h-7 w-16' />
        <Skeleton className='h-3 w-20' />
      </div>
      <Skeleton className='size-10 rounded-xl' />
    </div>
  );
}
