import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon, type DashboardIconName } from '@/components/icons';
import { cn } from '@/lib/utils';
import { DashboardMetricDelta } from './dashboard-metric-delta';

type HighlightTone = 'warning' | 'critical' | 'success';

type TrendDirection = 'up' | 'down' | 'flat';

type TrendTone = 'positive' | 'negative' | 'warning';

export interface DashboardKpiTrend {
  value: string;
  direction?: TrendDirection;
  label?: string;
  tone?: TrendTone;
}

export interface DashboardKpiCardProps
  extends React.ComponentPropsWithoutRef<typeof Card> {
  title: string;
  description?: string;
  value?: number | string | React.ReactNode;
  caption?: string;
  icon?: DashboardIconName;
  highlight?: HighlightTone;
  trend?: DashboardKpiTrend;
  isLoading?: boolean;
  contentClassName?: string;
}

export function DashboardKpiCard({
  title,
  description,
  value,
  caption,
  icon,
  highlight,
  trend,
  isLoading,
  contentClassName,
  className,
  children,
  ...props
}: DashboardKpiCardProps) {
  const displayValue = React.useMemo(() => {
    if (React.isValidElement(value)) return value;
    if (typeof value === 'number') return value.toLocaleString();
    return value ?? '—';
  }, [value]);

  return (
    <Card
      className={cn('dashboard-card h-full', className)}
      data-highlight={highlight}
      {...props}
    >
      <CardHeader className='dashboard-card-header pb-3'>
        <div className='space-y-1'>
          <CardTitle className='dashboard-card-title'>{title}</CardTitle>
          {description ? (
            <CardDescription className='dashboard-card-description'>
              {description}
            </CardDescription>
          ) : null}
        </div>
        {icon ? (
          <span className='dashboard-card-icon'>
            <Icon name={icon} className='h-5 w-5' strokeWidth={2.2} />
          </span>
        ) : null}
      </CardHeader>
      <CardContent className={cn('space-y-3', contentClassName)}>
        {isLoading ? (
          <>
            <Skeleton className='h-8 w-24' />
            <Skeleton className='h-4 w-32' />
          </>
        ) : (
          <>
            <div className='dashboard-metric-value'>{displayValue}</div>
            {caption ? <p className='dashboard-metric-caption'>{caption}</p> : null}
            {trend ? (
              <DashboardMetricDelta
                value={trend.value}
                direction={trend.direction ?? 'flat'}
                tone={trend.tone}
                label={trend.label}
              />
            ) : null}
            {children}
          </>
        )}
      </CardContent>
    </Card>
  );
}
