import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Page header ported from the Lovable design: left teal accent bar, optional
 * eyebrow, title, description and right-aligned actions. Presentational only.
 * Prop-compatible with the previous admin page header so it can be aliased in.
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
        'relative flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <span
        aria-hidden
        className='absolute -left-4 top-0 hidden h-8 w-1 rounded-full bg-gradient-to-b from-teal-600 to-cyan-400 sm:block'
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
