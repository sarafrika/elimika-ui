import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
    <dl
      className={cn(
        'grid gap-6',
        columns === 2 && 'sm:grid-cols-2',
        className
      )}
    >
      {children}
    </dl>
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
}

export function ProfileViewListItem({
  title,
  subtitle,
  description,
  badge,
  dateRange,
  children,
  className,
}: ProfileViewListItemProps) {
  return (
    <div className={cn('border-border/60 rounded-lg border bg-card/30 p-4 space-y-2', className)}>
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
      {dateRange && <p className='text-muted-foreground text-xs'>{dateRange}</p>}
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