import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ProfileViewFieldProps {
  label: string;
  value?: string | ReactNode;
  icon?: ReactNode;
  className?: string;
  valueClassName?: string;
}

export function ProfileViewField({
  label,
  value,
  icon,
  className,
  valueClassName,
}: ProfileViewFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <dt className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
        {icon}
        {label}
      </dt>
      <dd className={cn('text-foreground text-base', valueClassName)}>
        {value || <span className='text-muted-foreground italic'>Not specified</span>}
      </dd>
    </div>
  );
}

interface ProfileViewGridProps {
  children: ReactNode;
  columns?: 1 | 2;
  className?: string;
}

export function ProfileViewGrid({ children, columns = 2, className }: ProfileViewGridProps) {
  return (
    <dl className={cn('grid gap-6', columns === 2 && 'sm:grid-cols-2', className)}>{children}</dl>
  );
}

interface ProfileViewListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  dateRange?: string;
  children?: ReactNode;
  className?: string;
  year_completed?: string;
}

export function ProfileViewListItem({
  title,
  subtitle,
  description,
  badge,
  dateRange,
  children,
  className,
  year_completed,
}: ProfileViewListItemProps) {
  return (
    <div className={cn('border-border/60 bg-card/30 space-y-2 rounded-lg border p-4', className)}>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex-1 space-y-1'>
          <h4 className='text-foreground font-semibold'>{title}</h4>
          {subtitle && <p className='text-muted-foreground text-sm'>{subtitle}</p>}
        </div>
        {badge && (
          <Badge variant='secondary' className='flex-shrink-0'>
            {badge}
          </Badge>
        )}
      </div>
      <div className='flex flex-row items-center justify-between'>
        {dateRange && <p className='text-muted-foreground text-xs'>{dateRange}</p>}
        {year_completed && (
          <p className='text-muted-foreground text-xs'>Completed: {year_completed}</p>
        )}
      </div>

      {description && <p className='text-foreground text-sm'>{description}</p>}
      {children}
    </div>
  );
}

interface ProfileViewListProps {
  children: ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function ProfileViewList({ children, emptyMessage, className }: ProfileViewListProps) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  if (!hasChildren && emptyMessage) {
    return (
      <div className='text-muted-foreground flex items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm italic'>
        {emptyMessage}
      </div>
    );
  }

  return <div className={cn('space-y-4', className)}>{children}</div>;
}
