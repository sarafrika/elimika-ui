import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { DashboardChartCard } from '@/components/ui/dashboard';
import type { AdminDashboardStatsDTO } from '@/services/api/actions';

interface SystemHealthProps {
  statistics?: AdminDashboardStatsDTO;
  isLoading: boolean;
}

const toNumber = (value?: bigint | number | string | null) => {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const parsePercentage = (value?: string | number | null) => {
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return undefined;
    return Math.min(100, Math.max(0, value));
  }

  if (typeof value === 'string') {
    const match = value.match(/-?\d+(\.\d+)?/);
    if (!match) return undefined;
    const parsed = Number.parseFloat(match[0]);
    if (Number.isNaN(parsed)) return undefined;
    return Math.min(100, Math.max(0, parsed));
  }

  return undefined;
};

const parseDurationMs = (value?: string | number | null) => {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? undefined : value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    const numeric = Number.parseFloat(trimmed);
    if (Number.isNaN(numeric)) {
      return undefined;
    }
    if (trimmed.endsWith('ms')) {
      return numeric;
    }
    if (trimmed.endsWith('s')) {
      return numeric * 1_000;
    }
    return numeric;
  }

  return undefined;
};

const formatNumber = (value?: bigint | number | string | null) =>
  new Intl.NumberFormat().format(toNumber(value));

export default function SystemHealth({ statistics, isLoading }: SystemHealthProps) {
  if (isLoading) {
    return (
      <DashboardChartCard
        title='System health'
        description='Operational signals for core platform services'
      >
        <div className='space-y-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className='space-y-2'>
              <Skeleton className='h-4 w-40' />
              <Skeleton className='h-2 w-full' />
            </div>
          ))}
        </div>
      </DashboardChartCard>
    );
  }

  const performance = statistics?.system_performance;
  const overallHealth = (statistics?.overall_health ?? 'healthy') as
    | 'healthy'
    | 'warning'
    | 'critical';

  const hasPerformanceData =
    !!performance &&
    Object.values(performance).some(value => value !== null && value !== undefined && value !== '');

  const statusMeta: Record<
    'healthy' | 'warning' | 'critical',
    { label: string; variant: 'success' | 'warning' | 'destructive'; icon: typeof CheckCircle }
  > = {
    healthy: { label: 'Healthy', variant: 'success', icon: CheckCircle },
    warning: { label: 'Warning', variant: 'warning', icon: AlertTriangle },
    critical: { label: 'Critical', variant: 'destructive', icon: AlertCircle },
  };

  const serverUptime = parsePercentage(performance?.server_uptime) ?? 0;
  const errorRate = parsePercentage(performance?.error_rate) ?? 0;
  const storageUsage = parsePercentage(performance?.storage_usage) ?? 0;
  const responseTime = parseDurationMs(performance?.average_response_time);

  const responseSeverity: 'success' | 'warning' | 'destructive' | 'secondary' = (() => {
    if (responseTime === undefined) return 'secondary';
    if (responseTime <= 400) return 'success';
    if (responseTime <= 800) return 'warning';
    return 'destructive';
  })();

  const responseProgressValue =
    responseTime === undefined ? 0 : Math.min(100, Math.max(0, (responseTime / 1_000) * 100));

  const adminMetrics = statistics?.admin_metrics;
  const status = statusMeta[overallHealth] ?? statusMeta.healthy;

  return (
    <DashboardChartCard
      title='System health'
      description='Operational signals for core platform services'
      toolbar={
        <Badge variant={status.variant} className='gap-1'>
          <status.icon className='h-3 w-3' />
          {status.label}
        </Badge>
      }
    >
      {hasPerformanceData ? (
        <div className='space-y-5'>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Activity className='text-muted-foreground h-4 w-4' />
                <span className='text-sm font-medium'>Server uptime</span>
              </div>
              <span className='text-sm font-semibold'>{performance?.server_uptime ?? 'N/A'}</span>
            </div>
            <Progress value={serverUptime} indicatorClassName='bg-success' className='h-2' />
          </div>

          <Separator />

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Clock className='text-muted-foreground h-4 w-4' />
                <span className='text-sm font-medium'>Average response time</span>
              </div>
              <Badge variant={responseSeverity} className='text-xs font-medium'>
                {responseTime !== undefined ? `${Math.round(responseTime)} ms` : 'Unknown'}
              </Badge>
            </div>
            <Progress
              value={responseProgressValue}
              indicatorClassName={
                responseSeverity === 'success'
                  ? 'bg-success'
                  : responseSeverity === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-destructive'
              }
              className='h-2'
            />
            <div className='text-muted-foreground text-xs'>Target ≤ 500 ms</div>
          </div>

          <Separator />

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <AlertTriangle className='text-muted-foreground h-4 w-4' />
                <span className='text-sm font-medium'>Error rate</span>
              </div>
              <span className='text-sm font-semibold'>{performance?.error_rate ?? 'N/A'}</span>
            </div>
            <Progress
              value={errorRate}
              indicatorClassName={errorRate > 5 ? 'bg-destructive' : 'bg-success'}
              className='h-2'
            />
          </div>

          <Separator />

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Database className='text-muted-foreground h-4 w-4' />
                <span className='text-sm font-medium'>Storage usage</span>
              </div>
              <span className='text-sm font-semibold'>{performance?.storage_usage ?? 'N/A'}</span>
            </div>
            <Progress value={storageUsage} className='h-2' />
          </div>
        </div>
      ) : (
        <div className='text-muted-foreground text-sm'>
          No system telemetry was included in this snapshot. Metrics will appear once monitoring data
          becomes available.
        </div>
      )}

      <Separator className='my-5' />

      <div className='bg-muted/60 rounded-lg p-4'>
        <h4 className='text-sm font-semibold'>Admin activity</h4>
        <div className='mt-3 grid grid-cols-2 gap-4 text-sm'>
          <div>
            <p className='text-muted-foreground text-xs uppercase tracking-wide'>Active sessions</p>
            <p className='text-lg font-bold'>
              {formatNumber(adminMetrics?.active_admin_sessions)}
            </p>
          </div>
          <div>
            <p className='text-muted-foreground text-xs uppercase tracking-wide'>Actions today</p>
            <p className='text-lg font-bold'>
              {formatNumber(adminMetrics?.admin_actions_today)}
            </p>
          </div>
        </div>
      </div>
    </DashboardChartCard>
  );
}
