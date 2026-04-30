import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  variant?: 'default' | 'card' | 'compact';
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = 'default',
}: EmptyStateProps) {
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'border-border text-muted-foreground flex flex-col items-center gap-2 rounded-md border border-dashed px-6 py-8 text-center text-sm',
          className
        )}
      >
        {Icon && <Icon className='text-muted-foreground/70 h-6 w-6' />}
        <p className='text-foreground font-medium'>{title}</p>
        {description && <p>{description}</p>}
        {action && <div className='pt-2'>{action}</div>}
      </div>
    );
  }

  const wrapper =
    variant === 'card'
      ? 'border-border bg-card rounded-2xl border p-10 shadow-sm'
      : 'rounded-2xl border border-dashed border-border/70 bg-card/40 p-10';

  return (
    <div
      className={cn('mx-auto flex max-w-md flex-col items-center text-center', wrapper, className)}
    >
      {Icon && (
        <div className='bg-primary/10 mb-4 flex h-14 w-14 items-center justify-center rounded-full'>
          <Icon className='text-primary h-7 w-7' />
        </div>
      )}
      <h3 className='text-foreground text-lg font-semibold'>{title}</h3>
      {description && (
        <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>{description}</p>
      )}
      {action && <div className='mt-6'>{action}</div>}
    </div>
  );
}
