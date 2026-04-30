import { Card } from '@/components/ui/card';
import type { SchedulerMetric } from './types';

export function SchedulerStatCard({ metric }: { metric: SchedulerMetric }) {
  return (
    <Card className='rounded-md border p-2 shadow-sm'>
      <div className='flex items-center gap-2'>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${metric.tone}`}
        >
          <metric.icon className='h-4 w-4' />
        </span>

        <span className='min-w-0'>
          <span className='text-foreground block text-[11px] font-medium'>
            {metric.label}
          </span>

          <span className='text-foreground block text-lg leading-none font-semibold'>
            {metric.value}
          </span>

          <span className='text-muted-foreground block truncate text-[10px]'>
            {metric.helper}
          </span>
        </span>
      </div>
    </Card>
  );
}