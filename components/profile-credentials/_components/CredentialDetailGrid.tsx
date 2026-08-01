'use client';

import { cn } from '@/lib/utils';
import type { CredentialDetail } from '../data';

type CredentialDetailGridProps = {
  details?: CredentialDetail[];
  className?: string;
};

export function CredentialDetailGrid({ details = [], className }: CredentialDetailGridProps) {
  if (!details.length) return null;

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2', className)}>
      {details.map(detail => (
        <div
          key={`${detail.label}-${detail.value}`}
          className='bg-muted/20 rounded-xl border px-3 py-2.5'
        >
          <p className='text-muted-foreground text-xs tracking-wide uppercase'>{detail.label}</p>
          <p className='text-foreground mt-1 text-sm leading-5 font-medium'>{detail.value}</p>
        </div>
      ))}
    </div>
  );
}
