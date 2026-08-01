import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned actions (buttons, etc.). */
  actions?: ReactNode;
  /** Optional eyebrow/breadcrumb rendered above the title. */
  eyebrow?: ReactNode;
  className?: string;
}

/**
 * Refined page header — renders instantly (server component) so the page shell paints
 * before any data streams in. Used at the top of every admin page.
 */
export function AdminPageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        'border-border/70 bg-card rounded-md border px-5 py-5 shadow-sm sm:px-6 lg:px-7',
        className
      )}
    >
      <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
        <div className='space-y-1.5'>
          {eyebrow ? <div className='text-muted-foreground text-xs'>{eyebrow}</div> : null}
          <h1 className='text-foreground text-2xl font-semibold tracking-tight sm:text-3xl'>
            {title}
          </h1>
          {description ? (
            <p className='text-muted-foreground max-w-2xl text-sm'>{description}</p>
          ) : null}
        </div>
        {actions ? <div className='flex flex-wrap items-center gap-2'>{actions}</div> : null}
      </div>
    </header>
  );
}
