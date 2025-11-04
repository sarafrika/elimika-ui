import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DashboardChartCard,
  DashboardHealthIndicator,
} from '@/components/ui/dashboard';
import { Icon } from '@/components/icons';

interface SystemHealthProps {
  statistics: any;
  isLoading: boolean;
}

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

  const healthStatus = {
    healthy: { status: 'healthy' as const, label: 'Healthy' },
    warning: { status: 'warning' as const, label: 'Warning' },
    critical: { status: 'critical' as const, label: 'Critical' },
  };

  const currentStatus =
    healthStatus[overallHealth as keyof typeof healthStatus] || healthStatus.healthy;

  // Parse storage usage percentage
  const storageUsage = performance?.storage_usage
    ? parseFloat(performance.storage_usage.replace('%', ''))
    : 0;

  // Parse error rate percentage
  const errorRate = performance?.error_rate
    ? parseFloat(performance.error_rate.replace('%', ''))
    : 0;

  const serverUptime = performance?.server_uptime
    ? parseFloat(performance.server_uptime.replace('%', ''))
    : 0;

  const averageResponseTime = performance?.average_response_time
    ? parseFloat(performance.average_response_time.replace('%', ''))
    : 0;

  const metricRows = [
    {
      key: 'uptime',
      icon: 'activity' as const,
      label: 'Server uptime',
      value: performance?.server_uptime ?? 'N/A',
      progress: serverUptime,
      indicatorClassName: undefined,
    },
    {
      key: 'response',
      icon: 'clock' as const,
      label: 'Avg response time',
      value: performance?.average_response_time ?? 'N/A',
      progress: averageResponseTime,
      indicatorClassName: undefined,
    },
    {
      key: 'error-rate',
      icon: 'warning' as const,
      label: 'Error rate',
      value: performance?.error_rate ?? 'N/A',
      progress: errorRate,
      indicatorClassName: errorRate > 5 ? 'bg-destructive' : 'bg-success',
    },
    {
      key: 'storage',
      icon: 'database' as const,
      label: 'Storage usage',
      value: performance?.storage_usage ?? 'N/A',
      progress: storageUsage,
      indicatorClassName: undefined,
    },
  ];

  const adminSessions = statistics?.admin_metrics?.active_admin_sessions ?? 0;
  const adminActions = statistics?.admin_metrics?.admin_actions_today ?? 0;

  return (
    <DashboardChartCard
      title='System health'
      description='Operational signals for core platform services'
      toolbar={
        <DashboardHealthIndicator
          status={currentStatus.status}
          label={currentStatus.label}
          description='Overall platform status'
        />
      }
    >
      <div className='space-y-6'>
        <div className='dashboard-stat-grid'>
          {metricRows.map(metric => (
            <div key={metric.key} className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Icon name={metric.icon} className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm font-medium'>{metric.label}</span>
                </div>
                <span className='text-sm font-semibold'>{metric.value}</span>
              </div>
              <Progress
                value={metric.progress}
                className='h-2'
                indicatorClassName={metric.indicatorClassName}
              />
            </div>
          ))}
        </div>

        <div className='dashboard-quick-stats'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Icon name='sparkle' className='h-4 w-4 text-muted-foreground' />
              <h4 className='text-sm font-semibold leading-none'>Admin activity</h4>
            </div>
            <DashboardHealthIndicator
              status={adminActions > 0 ? 'healthy' : 'warning'}
              label={adminActions > 0 ? 'Active' : 'Quiet'}
              description='24h snapshot'
            />
          </div>
          <div className='dashboard-quick-stats__grid'>
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
