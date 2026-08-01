import { cn } from '../../../../../lib/utils';
import type { SchedulerMetric } from './types';

export function SchedularKpiStrip({
  rangeLabel,
  metrics,
}: {
  rangeLabel: string;
  metrics: SchedulerMetric[];
}) {
  return (
    <div
      className='border-border/70 bg-muted/30 rounded-xl border p-3'
      aria-label={`Calendar summary for ${rangeLabel}`}
    >
      <div className='text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase'>
        Summary · {rangeLabel}
      </div>
      <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7'>
        {metrics.map(metric => (
          <div key={metric.label} className='bg-card flex items-center gap-2 rounded-lg p-2.5'>
            <span
              className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-md', metric.tone)}
            >
              <metric.icon className='h-4 w-4' />
            </span>
            <div className='min-w-0'>
              <div className='text-base leading-tight font-semibold'>{metric.value}</div>
              <div className='text-foreground truncate text-[11px]'>{metric.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
