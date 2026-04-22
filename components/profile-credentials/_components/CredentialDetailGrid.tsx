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
        <div key={`${detail.label}-${detail.value}`} className='rounded-xl border bg-muted/20 px-3 py-2.5'>
          <p className='text-muted-foreground text-xs uppercase tracking-wide'>{detail.label}</p>
          <p className='text-foreground mt-1 text-sm font-medium leading-5'>{detail.value}</p>
        </div>
      ))}
    </div>
  );
}
