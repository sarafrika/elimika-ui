import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Canonical page header: left brand accent bar, optional eyebrow, title,
 * description and right-aligned actions. Presentational only.
 *
 * `components/page-header.tsx` is a thin adapter over this component that keeps
 * the older singular `action` prop working; new code should import from here.
 */
export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <span
        aria-hidden
        className='from-primary to-primary/50 absolute -left-4 top-0 hidden h-8 w-1 rounded-full bg-gradient-to-b sm:block'
      />
      <div className='min-w-0 space-y-1'>
        {eyebrow && (
          <div className='text-xs font-semibold uppercase tracking-wider text-primary'>{eyebrow}</div>
        )}
        <h1 className='text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>{title}</h1>
        {description && <p className='max-w-2xl text-sm text-muted-foreground'>{description}</p>}
      </div>
      {actions && <div className='flex flex-wrap gap-2'>{actions}</div>}
    </div>
  );
}
