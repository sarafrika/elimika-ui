import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, BarChart3, Clock3, FileCheck2 } from 'lucide-react';

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
      title: 'Pending Grading',
      value: `${insights.pendingGrading}`,
    },
    {
      icon: BarChart3,
      title: 'Total Submissions',
      value: `${insights.totalSubmissions}`,
    },
    {
      icon: Clock3,
      title: 'Analytics Signal',
      value: insights.averageSignal,
    },
    {
      icon: AlertCircle,
      title: 'Overdue Tasks',
      value: `${insights.overdueTasks}`,
    },
  ];

  return (
    <section aria-label='Assignment insights' className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      {insightMetrics.map(metric => {
        const Icon = metric.icon;

        return (
          <Card key={metric.title} className='border-border/70 min-w-0 rounded-xl py-0 shadow-sm'>
            <CardContent className='flex items-start gap-3 py-3'>
              <span className='bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10'>
                <Icon className='h-4 w-4 sm:h-5 sm:w-5' />
              </span>
              <div className='min-w-0 space-y-1'>
                <h2 className='text-muted-foreground text-sm font-medium'>{metric.title}</h2>
                <p className='text-foreground text-2xl font-bold tabular-nums sm:text-3xl'>
                  {metric.value}
                </p>
                {metric.changeText ? (
                  <p className='text-muted-foreground text-xs'>{metric.changeText}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
