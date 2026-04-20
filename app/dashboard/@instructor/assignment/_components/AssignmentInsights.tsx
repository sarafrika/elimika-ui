import { BarChart3, Clock3, FileCheck2 } from 'lucide-react';

type AssignmentInsightsProps = {
  insights: {
    averageSignal: string;
    overdueTasks: number;
    pendingGrading: number;
    totalSubmissions: number;
    totalTasks: number;
  };
};

export function AssignmentInsights({ insights }: AssignmentInsightsProps) {
  const insightMetrics = [
    {
      changeText: `${insights.totalTasks} task${insights.totalTasks === 1 ? '' : 's'} with activity`,
      icon: FileCheck2,
      progress: Math.min(insights.pendingGrading * 12, 100),
      title: 'Pending Grading',
      trendLabel: `${insights.pendingGrading}`,
      value: `${insights.pendingGrading}`,
    },
    {
      icon: BarChart3,
      progress: Math.min(insights.totalSubmissions, 100),
      title: 'Total Submissions',
      value: `${insights.totalSubmissions}`,
    },
    {
      icon: Clock3,
      progress: 0,
      title: 'Analytics Signal',
      value: insights.averageSignal,
    },
  ];

  return (
    <section className='border-border/70 bg-card overflow-hidden rounded-xl border shadow-sm'>
      <div className='border-border/60 bg-muted/30 border-b px-4 py-4 sm:px-5'>
        <p className='text-muted-foreground text-[11px] font-semibold tracking-[0.18em] uppercase'>
          Instructor overview
        </p>
        <h2 className='text-foreground mt-1 text-base font-bold tracking-tight sm:text-lg lg:text-xl'>
          Assignment Insights
        </h2>
        <p className='text-muted-foreground mt-1 text-xs leading-relaxed sm:text-sm'>
          A quick pulse on work assigned, submitted, and waiting for action.
        </p>
      </div>

      <div className='space-y-3 p-3 sm:p-4'>
        {insightMetrics.map(metric => {
          const Icon = metric.icon;
          const progress = Math.max(0, Math.min(metric.progress, 100));

          return (
            <div
              key={metric.title}
              className='border-border/60 bg-background/70 rounded-lg border p-3 sm:p-4'
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='flex min-w-0 items-start gap-3'>
                  <span className='bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10'>
                    <Icon className='h-4 w-4 sm:h-5 sm:w-5' />
                  </span>
                  <div className='min-w-0'>
                    <p className='text-foreground text-sm font-semibold sm:text-base'>
                      {metric.title}
                    </p>
                    <div className='text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs'>
                      {metric.trendLabel ? (
                        <span className='bg-warning/15 text-warning-foreground rounded-full px-2 py-0.5 font-semibold'>
                          {metric.trendLabel}
                        </span>
                      ) : null}
                      {metric.changeText ? <span>{metric.changeText}</span> : null}
                    </div>
                  </div>
                </div>

                <p className='text-foreground text-xl leading-none font-bold sm:text-2xl'>
                  {metric.value}
                </p>
              </div>

              <div className='mt-3 h-2 overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full rounded-full bg-primary transition-all'
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}

        <div className='from-primary/10 via-primary/5 to-background rounded-lg border border-primary/15 bg-gradient-to-br p-3 sm:p-4'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <p className='text-foreground text-sm font-semibold sm:text-base'>Overdue Tasks</p>
              <p className='text-muted-foreground mt-1 text-[11px] sm:text-xs'>
                Prioritize reminders and grading for stale submissions.
              </p>
            </div>
            <span className='text-destructive text-2xl font-bold sm:text-3xl'>
              {insights.overdueTasks}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
