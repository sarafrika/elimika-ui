import * as React from 'react';
import { cn } from '@/lib/utils';

export type DashboardShellProps = React.HTMLAttributes<HTMLDivElement>;

export function DashboardShell({ className, ...props }: DashboardShellProps) {
  return <div className={cn('dashboard-shell', className)} {...props} />;
}

export type DashboardSectionProps = React.HTMLAttributes<HTMLElement>;

export function DashboardSection({ className, ...props }: DashboardSectionProps) {
  return <section className={cn('dashboard-section', className)} {...props} />;
}

export type DashboardSectionHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export function DashboardSectionHeader({ className, ...props }: DashboardSectionHeaderProps) {
  return <div className={cn('dashboard-section-header', className)} {...props} />;
}

export type DashboardSectionTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export function DashboardSectionTitle({ className, ...props }: DashboardSectionTitleProps) {
  return <h2 className={cn('dashboard-section-title', className)} {...props} />;
}

export type DashboardSectionDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export function DashboardSectionDescription({
  className,
  ...props
}: DashboardSectionDescriptionProps) {
  return <p className={cn('dashboard-section-description', className)} {...props} />;
}

export interface DashboardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 'auto' | '1' | '2' | '3' | '4';
}

export function DashboardGrid({ columns = 'auto', className, ...props }: DashboardGridProps) {
  return (
    <div
      data-columns={columns === 'auto' ? undefined : columns}
      className={cn('dashboard-grid', className)}
      {...props}
    />
  );
}
