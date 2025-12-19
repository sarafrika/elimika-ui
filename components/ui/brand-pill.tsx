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
        'border-primary/30 bg-secondary/60 text-primary dark:border-primary/40 dark:bg-primary/10 dark:text-primary/90 inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold tracking-[0.2em] uppercase shadow-sm transition-colors',
        className
      )}
    >
      {icon && (
        <span className='text-primary flex h-4 w-4 items-center justify-center'>{icon}</span>
      )}
      {children}
    </span>
  );
}
