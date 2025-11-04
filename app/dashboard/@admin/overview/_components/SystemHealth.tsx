import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { AdminDashboardStatsDTO } from '@/services/api/actions';

interface SystemHealthProps {
  statistics?: AdminDashboardStatsDTO;
  isLoading: boolean;
}

const parsePercent = (value?: string) => {
  if (!value) return 0;
  const numeric = Number.parseFloat(value.replace(/%/g, ''));
  return Number.isNaN(numeric) ? 0 : numeric;
};

export default function SystemHealth({ statistics, isLoading }: SystemHealthProps) {
  if (isLoading) {
    return (
      <DashboardChartCard
        title='System health'
        description='Operational signals for core platform services'
      >
        <div className='space-y-4'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='h-16 w-full' />
          ))}
        </div>
      </DashboardChartCard>
    );
  }

  const performance = statistics?.system_performance;
  const overallHealth = statistics?.overall_health ?? 'healthy';

  const hasPerformanceData =
    !!performance && Object.values(performance).some(value => value !== undefined && value !== null);

  const healthStatus = {
    healthy: { status: 'healthy' as const, label: 'Healthy' },
    warning: { status: 'warning' as const, label: 'Warning' },
    critical: { status: 'critical' as const, label: 'Critical' },
  };

  const currentStatus =
    healthStatus[overallHealth as keyof typeof healthStatus] || healthStatus.healthy;

  // Parse storage usage percentage
  const storageUsage = parsePercent(performance?.storage_usage);

  // Parse error rate percentage
  const errorRate = parsePercent(performance?.error_rate);

  const serverUptime = parsePercent(performance?.server_uptime);

  const averageResponseTime = parsePercent(performance?.average_response_time);

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>System Health</CardTitle>
          <Badge variant={currentStatus.color as any} className='gap-1'>
            <currentStatus.icon className='h-3 w-3' />
            {currentStatus.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {hasPerformanceData ? (
          <>
            {/* Server Uptime */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Activity className='text-muted-foreground h-4 w-4' />
                  <span className='text-sm font-medium'>Server Uptime</span>
                </div>
                <span className='text-sm font-semibold'>{performance?.server_uptime ?? 'N/A'}</span>
              </div>
              <Progress value={serverUptime} className='h-2' />
            </div>

            <Separator />

            {/* Response Time */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Clock className='text-muted-foreground h-4 w-4' />
                  <span className='text-sm font-medium'>Avg Response Time</span>
                </div>
                <span className='text-sm font-semibold'>
                  {performance?.average_response_time ?? 'N/A'}
                </span>
              </div>
              <Progress value={averageResponseTime} className='h-2' />
            </div>

            <Separator />

            {/* Error Rate */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <AlertTriangle className='text-muted-foreground h-4 w-4' />
                  <span className='text-sm font-medium'>Error Rate</span>
                </div>
                <span className='text-sm font-semibold'>{performance?.error_rate ?? 'N/A'}</span>
              </div>
              <Progress
                value={errorRate}
                className='h-2'
                // @ts-ignore
                indicatorClassName={errorRate > 5 ? 'bg-destructive' : 'bg-success'}
              />
            </div>

            <Separator />

            {/* Storage Usage */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Database className='text-muted-foreground h-4 w-4' />
                  <span className='text-sm font-medium'>Storage Usage</span>
                </div>
                <span className='text-sm font-semibold'>{performance?.storage_usage ?? 'N/A'}</span>
              </div>
              <Progress value={storageUsage} className='h-2' />
            </div>

            <Separator />
          </>
        ) : (
          <div className='text-muted-foreground text-sm'>
            No system telemetry was included in this snapshot. Metrics will appear once the
            monitoring service begins reporting.
          </div>
        )}

        {/* Quick Stats */}
        <div className='bg-muted space-y-3 rounded-lg p-4'>
          <h4 className='text-sm font-semibold'>Admin Activity</h4>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-muted-foreground text-xs uppercase tracking-wide'>Active sessions</p>
              <p className='text-lg font-bold'>{adminSessions}</p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs uppercase tracking-wide'>Actions today</p>
              <p className='text-lg font-bold'>{adminActions}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardChartCard>
  );
}
