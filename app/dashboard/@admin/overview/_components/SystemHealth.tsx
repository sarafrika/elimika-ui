import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, Activity, Database, Clock, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { AdminDashboardStats } from '@/services/client/types.gen';

interface SystemHealthProps {
  statistics?: AdminDashboardStats;
  isLoading: boolean;
}

export default function SystemHealth({ statistics, isLoading }: SystemHealthProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='space-y-2'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-2 w-full' />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const performance = statistics?.system_performance;
  const overallHealth = statistics?.overall_health ?? 'healthy';

  const healthStatus: Record<
    'healthy' | 'warning' | 'critical',
    { color: 'success' | 'warning' | 'destructive'; icon: typeof CheckCircle; text: string }
  > = {
    healthy: { color: 'success', icon: CheckCircle, text: 'Healthy' },
    warning: { color: 'warning', icon: AlertTriangle, text: 'Warning' },
    critical: { color: 'destructive', icon: AlertCircle, text: 'Critical' },
  };

  const currentStatus =
    healthStatus[overallHealth as keyof typeof healthStatus] || healthStatus.healthy;

  const parsePercentage = (value?: string) => {
    if (!value) return undefined;
    const match = value.match(/[\d.]+/);
    if (!match) return undefined;
    const parsed = Number.parseFloat(match[0]);
    if (Number.isNaN(parsed)) return undefined;
    return Math.min(100, Math.max(0, parsed));
  };

  const toNumber = (value?: bigint | number | string | null) => {
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const storageUsage = parsePercentage(performance?.storage_usage) ?? 0;
  const errorRate = parsePercentage(performance?.error_rate) ?? 0;
  const serverUptime = parsePercentage(performance?.server_uptime) ?? 0;

  const responseTimeRaw = performance?.average_response_time;
  const responseTimeValue = responseTimeRaw
    ? Number.parseFloat(responseTimeRaw.replace(/[a-zA-Z]/g, ''))
    : undefined;
  const responseTimeSeverity: 'success' | 'warning' | 'destructive' | 'secondary' = (() => {
    if (responseTimeValue === undefined || Number.isNaN(responseTimeValue)) return 'secondary';
    if (responseTimeValue <= 400) return 'success';
    if (responseTimeValue <= 800) return 'warning';
    return 'destructive';
  })();

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>System Health</CardTitle>
          <Badge variant={currentStatus.color} className='gap-1'>
            <currentStatus.icon className='h-3 w-3' />
            {currentStatus.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Server Uptime */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Activity className='text-muted-foreground h-4 w-4' />
              <span className='text-sm font-medium'>Server Uptime</span>
            </div>
            <span className='text-sm font-semibold'>{performance?.server_uptime ?? 'N/A'}</span>
          </div>
          <Progress value={serverUptime} indicatorClassName='bg-success' className='h-2' />
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
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span>Target &lt; 500ms</span>
            <Badge variant={responseTimeSeverity}>
              {responseTimeValue ? `${responseTimeValue.toFixed(0)} ms` : 'Unknown'}
            </Badge>
          </div>
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
            indicatorClassName={errorRate > 5 ? 'bg-destructive' : 'bg-success'}
            className='h-2'
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

        {/* Quick Stats */}
        <div className='bg-muted space-y-3 rounded-lg p-4'>
          <h4 className='text-sm font-semibold'>Admin Activity</h4>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-muted-foreground text-xs'>Active Sessions</p>
              <p className='text-lg font-bold'>
                {toNumber(statistics?.admin_metrics?.active_admin_sessions).toLocaleString()}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs'>Actions Today</p>
              <p className='text-lg font-bold'>
                {toNumber(statistics?.admin_metrics?.admin_actions_today).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
