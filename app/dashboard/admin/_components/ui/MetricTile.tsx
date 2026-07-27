import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { type StatusTone, statusToneClass } from './admin-theme';

/** Compact metric tile (icon chip + value + label) for detail-page KPI rows. Server-safe. */
export function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'info',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ComponentType<{ className?: string }>;
  tone?: StatusTone;
}) {
  return (
    <div className='flex items-center gap-3 rounded-md border border-border/70 bg-card p-4 shadow-sm'>
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-md border',
          statusToneClass[tone]
        )}
      >
        <Icon className='size-5' />
      </span>
      <div className='min-w-0'>
        <p className='truncate text-xs font-medium uppercase tracking-wide text-muted-foreground'>
          {label}
        </p>
        <div className='truncate text-lg font-semibold text-foreground'>{value}</div>
        {hint ? <p className='truncate text-xs text-muted-foreground'>{hint}</p> : null}
      </div>
    </div>
  );
}
