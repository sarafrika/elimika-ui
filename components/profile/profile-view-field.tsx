import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

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