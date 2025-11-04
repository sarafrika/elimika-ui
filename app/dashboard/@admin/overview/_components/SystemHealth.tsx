import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, Activity, Database, Clock, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface SystemHealthProps {
  statistics: any;
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

  const healthStatus = {
    healthy: { color: 'success', icon: CheckCircle, text: 'Healthy' },
    warning: { color: 'warning', icon: AlertTriangle, text: 'Warning' },
    critical: { color: 'destructive', icon: AlertCircle, text: 'Critical' },
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

        {/* Quick Stats */}
        <div className='bg-muted space-y-3 rounded-lg p-4'>
          <h4 className='text-sm font-semibold'>Admin Activity</h4>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-muted-foreground text-xs'>Active Sessions</p>
              <p className='text-lg font-bold'>
                {statistics?.admin_metrics?.active_admin_sessions ?? 0}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs'>Actions Today</p>
              <p className='text-lg font-bold'>
                {statistics?.admin_metrics?.admin_actions_today ?? 0}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
