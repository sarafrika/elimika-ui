"use client";

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type BadgeTone = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';

interface DomainOverviewShellProps {
  domainLabel: string;
  title: string;
  subtitle: string;
  badge?: {
    label: string;
    tone?: BadgeTone;
  };
  actions?: ReactNode;
  leftColumn: ReactNode;
  rightColumn: ReactNode;
  className?: string;
}

export function DomainOverviewShell({
  domainLabel,
  title,
  subtitle,
  badge,
  actions,
  leftColumn,
  rightColumn,
  className,
}: DomainOverviewShellProps) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl space-y-6 px-4 py-10 overflow-x-auto', className)}>
      <div className='rounded-3xl border border-border bg-card p-6 shadow-sm'>
        <div className='flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
          <div className='space-y-2'>
            <Badge variant='outline' className='border-border/70 bg-muted/60 text-xs font-semibold uppercase tracking-[0.3em]'>
              {domainLabel}
            </Badge>
            <h1 className='text-3xl font-semibold tracking-tight'>{title}</h1>
            <p className='text-muted-foreground text-sm'>{subtitle}</p>
          </div>
          <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
            {badge ? (
              <Badge
                variant={badge.tone ?? 'outline'}
                className='gap-1 rounded-full px-3 py-1 text-xs font-semibold tracking-wide'
              >
                {badge.label}
              </Badge>
            ) : null}
            {actions}
          </div>
        </div>
      </div>

      <div className='grid gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]'>
        <section className='space-y-4'>{leftColumn}</section>
        <section className='space-y-4'>{rightColumn}</section>
      </div>
    </div>
  );
}

export default DomainOverviewShell;
