'use client';

import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { StatDescriptor } from '../types';

/**
 * Renders a stat tile's value, showing a shape-matching skeleton while the
 * backing query is in flight. Domain tab modules build their stat values out of
 * small components that use this so the strip never flashes a fake zero.
 */
export function StatValue({
  loading,
  value,
  fallback = '—',
}: {
  loading?: boolean;
  value?: ReactNode;
  fallback?: ReactNode;
}) {
  if (loading) {
    return <Skeleton className='h-4 w-10' />;
  }

  return <>{value ?? fallback}</>;
}

export function ProfileStatStrip({ stats }: { stats: StatDescriptor[] }) {
  if (stats.length === 0) return null;

  return (
    <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
      {stats.map(stat => (
        <Card key={stat.id}>
          <CardContent className='flex items-center gap-3 px-4'>
            {stat.icon ? (
              <div className='bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full'>
                {stat.icon}
              </div>
            ) : null}
            <div className='min-w-0'>
              <p className='text-muted-foreground text-[10px] tracking-wide uppercase'>
                {stat.label}
              </p>
              <div className='text-sm font-semibold'>{stat.value}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
