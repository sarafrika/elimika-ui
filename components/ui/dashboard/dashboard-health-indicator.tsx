import * as React from 'react';
import { cn } from '@/lib/utils';
import { Icon, type DashboardIconName } from '@/components/icons';

type HealthStatus = 'healthy' | 'warning' | 'critical';

const statusIcon: Record<HealthStatus, DashboardIconName> = {
  healthy: 'success',
  warning: 'warning',
  critical: 'critical',
};

export interface DashboardHealthIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  status: HealthStatus;
  label?: string;
  description?: string;
}

export function DashboardHealthIndicator({
  status,
  label,
  description,
  className,
  ...props
}: DashboardHealthIndicatorProps) {
  return (
    <div
      data-status={status}
      className={cn('dashboard-health-indicator', className)}
      {...props}
    >
      <span className='dashboard-health-indicator__icon'>
        <Icon name={statusIcon[status]} className='h-4 w-4' strokeWidth={2.5} />
      </span>
      <div className='flex flex-col leading-tight'>
        <span className='dashboard-health-indicator__label'>
          {label ?? status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        {description ? (
          <span className='dashboard-health-indicator__description'>{description}</span>
        ) : null}
      </div>
    </div>
  );
}
