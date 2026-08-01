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
    <div className='border-border/70 bg-card flex items-center gap-3 rounded-md border p-4 shadow-sm'>
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-md border',
          statusToneClass[tone]
        )}
      >
        <Icon className='size-5' />
      </span>
      <div className='min-w-0'>
        <p className='text-muted-foreground truncate text-xs font-medium tracking-wide uppercase'>
          {label}
        </p>
        <div className='text-foreground truncate text-lg font-semibold'>{value}</div>
        {hint ? <p className='text-muted-foreground truncate text-xs'>{hint}</p> : null}
      </div>
    </div>
  );
}
