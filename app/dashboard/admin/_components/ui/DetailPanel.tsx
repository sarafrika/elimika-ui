import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** A single labeled key/value cell. Server-safe. */
export function DetailRow({
  label,
  value,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-border/60 bg-muted/20 rounded-md border px-3 py-2.5', className)}>
      <p className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</p>
      <div className='text-foreground mt-1 text-sm font-medium'>{value ?? '—'}</div>
    </div>
  );
}

/** Responsive grid of DetailRows. */
export function DetailGrid({
  items,
  columns = 2,
  className,
}: {
  items: Array<{ label: ReactNode; value: ReactNode }>;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const cols =
    columns === 1 ? 'sm:grid-cols-1' : columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2';
  return (
    <div className={cn('grid gap-3', cols, className)}>
      {items.map((item, index) => (
        <DetailRow key={index} label={item.label} value={item.value} />
      ))}
    </div>
  );
}
