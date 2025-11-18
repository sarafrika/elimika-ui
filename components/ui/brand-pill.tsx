import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BrandPillProps {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function BrandPill({ children, className, icon }: BrandPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-primary/30 bg-secondary/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary shadow-sm transition-colors dark:border-primary/40 dark:bg-primary/10 dark:text-primary/90',
        className
      )}
    >
      {icon && <span className='flex h-4 w-4 items-center justify-center text-primary'>{icon}</span>}
      {children}
    </span>
  );
}
