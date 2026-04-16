import { insightMetrics } from './assignment-data';

export function AssignmentInsights() {
  return (
    <section className='border-border/60 rounded-2xl border bg-white p-5 shadow-sm'>
      <h2 className='text-foreground text-xl font-semibold'>Assignment Insights</h2>
      <div className='mt-5 space-y-5'>
        {insightMetrics.map(metric => (
          <div
            key={metric.title}
            className='border-border/50 flex items-center justify-between gap-4 border-b pb-5 last:border-b-0 last:pb-0'
          >
            <div className='space-y-2'>
              <p className='text-foreground text-lg font-medium'>{metric.title}</p>
              <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-sm'>
                {metric.trendLabel ? (
                  <span className='rounded-full bg-warning/15 px-2 py-1 text-foreground'>
                    {metric.trendLabel}
                  </span>
                ) : null}
                {metric.changeText ? <span>{metric.changeText}</span> : null}
              </div>
              {!metric.changeText && metric.progress === 0 ? (
                <p className='text-foreground text-2xl font-semibold'>{metric.value}</p>
              ) : null}
            </div>

            {metric.progress > 0 ? (
              <div className='relative flex h-20 w-20 items-center justify-center rounded-full bg-[conic-gradient(var(--color-ring)_0_var(--progress),color-mix(in_oklch,var(--border)_80%,transparent)_var(--progress)_360deg)] [--color-ring:var(--color-chart-2)] [--progress:230deg]'>
                <div className='bg-white flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold'>
                  {metric.value}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
