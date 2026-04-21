import { Card } from '@/components/ui/card';
import type { SchedulerMetric } from './types';

export function SchedulerStatCard({ metric }: { metric: SchedulerMetric }) {
  return (
    <Card className='rounded-md border p-3 shadow-sm'>
      <div className='flex items-center gap-3'>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${metric.tone}`}
        >
          <metric.icon className='h-5 w-5' />
        </span>
        <span className='min-w-0'>
          <span className='text-foreground block text-xs font-semibold sm:text-sm'>
            {metric.label}
          </span>
          <span className='text-foreground block text-2xl leading-none font-semibold sm:text-3xl'>
            {metric.value}
          </span>
          <span className='text-muted-foreground block truncate text-[11px]'>{metric.helper}</span>
        </span>
      </div>
    </Card>
  );
}
