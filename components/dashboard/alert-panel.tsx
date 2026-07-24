import type { LucideIcon } from 'lucide-react';
import { BellOff, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type AlertSeverity = 'high' | 'medium' | 'low';

export interface AlertItem {
  id: string | number;
  severity: AlertSeverity;
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  /** Link target for the action; falls back to onAction if omitted. */
  href?: string;
  onAction?: () => void;
}

const severityStyles: Record<AlertSeverity, { chip: string; icon: string; bar: string; label: string }> = {
  high: {
    chip: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
    icon: 'bg-rose-500/15 text-rose-600',
    bar: 'bg-rose-500',
    label: 'High',
  },
  medium: {
    chip: 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
    icon: 'bg-amber-500/15 text-amber-600',
    bar: 'bg-amber-500',
    label: 'Medium',
  },
  low: {
    chip: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900',
    icon: 'bg-sky-500/15 text-sky-600',
    bar: 'bg-sky-500',
    label: 'Low',
  },
};

/** Presentational alerts panel. Container supplies the `alerts`. */
export function AlertPanel({
  alerts,
  title = 'Alerts',
  className,
}: {
  alerts: AlertItem[];
  title?: string;
  className?: string;
}) {
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-semibold'>{title}</CardTitle>
          {alerts.length > 0 && (
            <span className='rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'>
              {alerts.length} new
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        {alerts.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-2 py-10 text-center'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground'>
              <BellOff className='h-5 w-5' />
            </div>
            <p className='text-sm text-muted-foreground'>You&apos;re all caught up.</p>
          </div>
        ) : (
          alerts.map(alert => {
            const s = severityStyles[alert.severity];
            return (
              <div
                key={alert.id}
                className='group relative flex items-start gap-3 overflow-hidden rounded-lg border bg-card p-3 pl-4 transition-colors hover:bg-muted/40'
              >
                <span className={cn('absolute inset-y-0 left-0 w-1', s.bar)} aria-hidden />
                <div
                  className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm',
                    s.icon
                  )}
                >
                  <alert.icon className='h-4 w-4' />
                </div>
                <div className='min-w-0 flex-1 space-y-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='text-sm font-semibold'>{alert.title}</p>
                    <span
                      className={cn('rounded-full border px-1.5 py-0.5 text-[10px] font-medium', s.chip)}
                    >
                      {s.label}
                    </span>
                  </div>
                  <p className='text-xs text-muted-foreground'>{alert.description}</p>
                </div>
                {alert.actionLabel && (
                  <AlertAction
                    label={alert.actionLabel}
                    href={alert.href}
                    onAction={alert.onAction}
                  />
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function AlertAction({
  label,
  href,
  onAction,
}: {
  label: string;
  href?: string;
  onAction?: () => void;
}) {
  const className =
    'h-8 shrink-0 self-center text-xs font-semibold text-primary hover:text-primary';
  if (href) {
    return (
      <Button asChild variant='ghost' size='sm' className={className}>
        <Link href={href}>
          {label}
          <ChevronRight className='ml-0.5 h-3.5 w-3.5' />
        </Link>
      </Button>
    );
  }
  return (
    <Button variant='ghost' size='sm' className={className} onClick={onAction}>
      {label}
      <ChevronRight className='ml-0.5 h-3.5 w-3.5' />
    </Button>
  );
}
