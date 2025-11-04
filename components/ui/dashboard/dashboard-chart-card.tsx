import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface DashboardChartCardProps
  extends React.ComponentPropsWithoutRef<typeof Card> {
  title: string;
  description?: string;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  contentClassName?: string;
}

export function DashboardChartCard({
  title,
  description,
  toolbar,
  footer,
  className,
  contentClassName,
  children,
  ...props
}: DashboardChartCardProps) {
  return (
    <Card className={cn('dashboard-card h-full', className)} {...props}>
      <CardHeader className='dashboard-card-header pb-0'>
        <div className='space-y-1'>
          <CardTitle className='dashboard-card-title'>{title}</CardTitle>
          {description ? (
            <CardDescription className='dashboard-card-description'>
              {description}
            </CardDescription>
          ) : null}
        </div>
        {toolbar ? <div className='flex items-center gap-2'>{toolbar}</div> : null}
      </CardHeader>
      <CardContent className={cn('pt-6', contentClassName)}>{children}</CardContent>
      {footer ? <CardFooter className='pt-0'>{footer}</CardFooter> : null}
    </Card>
  );
}
