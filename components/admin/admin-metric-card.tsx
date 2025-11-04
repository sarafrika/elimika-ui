import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AdminMetric = {
  id: string;
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: string | null;
  trendDirection?: 'up' | 'down' | null;
  highlight?: boolean;
};

export function AdminMetricGrid({
  metrics,
  isLoading,
  skeletonCount = 4,
}: {
  metrics: AdminMetric[];
  isLoading?: boolean;
  skeletonCount?: number;
}) {
  if (isLoading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Card key={index}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-8 w-8 rounded-full' />
            </CardHeader>
            <CardContent>
              <Skeleton className='mb-2 h-8 w-20' />
              <Skeleton className='h-3 w-32' />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {metrics.map(metric => (
        <AdminMetricCard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}

export function AdminMetricCard({ metric }: { metric: AdminMetric }) {
  const Icon = metric.icon;
  const highlight = metric.highlight ?? false;
  const trendVariant = metric.trendDirection === 'down' ? 'destructive' : 'success';

  return (
    <Card className={cn(highlight && 'border-warning bg-warning/10')}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{metric.title}</CardTitle>
        <div
          className={cn('rounded-full p-2', highlight ? 'bg-warning/30 text-warning-foreground' : 'bg-primary/10')}
        >
          <Icon className={cn('h-4 w-4', highlight ? 'text-warning' : 'text-primary')} />
        </div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>
          {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
        </div>
        {(metric.description || metric.trend) && (
          <div className='flex items-center justify-between gap-2'>
            {metric.description && <p className='text-muted-foreground text-xs'>{metric.description}</p>}
            {metric.trend && (
              <Badge variant={metric.trendDirection ? trendVariant : 'outline'} className='text-xs'>
                {metric.trend}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
