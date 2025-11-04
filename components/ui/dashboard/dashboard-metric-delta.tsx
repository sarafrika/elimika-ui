import * as React from 'react';
import { cn } from '@/lib/utils';
import { Icon, type DashboardIconName } from '@/components/icons';

type MetricDirection = 'up' | 'down' | 'flat';
type MetricTone = 'positive' | 'negative' | 'warning';

const directionIcon: Record<MetricDirection, DashboardIconName> = {
  up: 'delta-up',
  down: 'delta-down',
  flat: 'delta-flat',
};

const directionTone: Record<MetricDirection, MetricTone> = {
  up: 'positive',
  down: 'negative',
  flat: 'warning',
};

export interface DashboardMetricDeltaProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  value: string;
  direction?: MetricDirection;
  tone?: MetricTone;
  label?: string;
}

export function DashboardMetricDelta({
  value,
  direction = 'flat',
  tone,
  label,
  className,
  ...props
}: DashboardMetricDeltaProps) {
  const resolvedTone = tone ?? directionTone[direction];
  return (
    <span
      className={cn('dashboard-metric-delta', className)}
      data-tone={resolvedTone}
      {...props}
    >
      <Icon
        name={directionIcon[direction]}
        className='h-3.5 w-3.5'
        strokeWidth={2.5}
      />
      <span>{value}</span>
      {label ? <span className='text-muted-foreground text-xs font-medium'>{label}</span> : null}
    </span>
  );
}
