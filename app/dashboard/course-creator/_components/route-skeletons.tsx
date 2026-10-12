import type { ReactNode } from 'react';
import { SectionCardSkeleton, StatCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

// Route-level loading.tsx fallbacks: server-rendered, so they paint before the page chunk loads.
function RouteSkeletonShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <main className={surfaceTheme.page} role='status' aria-label={label}>
      <span className='sr-only'>{label}…</span>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-7 w-56' />
          <Skeleton className='h-4 w-80 max-w-full' />
        </div>
        {children}
      </div>
    </main>
  );
}

export function DashboardRouteSkeleton({ label = 'Loading dashboard' }: { label?: string }) {
  return (
    <RouteSkeletonShell label={label}>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
      <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        <SectionCardSkeleton rows={6} />
        <SectionCardSkeleton rows={6} />
      </div>
    </RouteSkeletonShell>
  );
}

export function ListRouteSkeleton({ label = 'Loading' }: { label?: string }) {
  return (
    <RouteSkeletonShell label={label}>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <Skeleton className='h-10 w-full max-w-md' />
        <Skeleton className='h-10 w-32' />
      </div>
      <section className='border-border/70 bg-card space-y-4 rounded-md border p-5'>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className='flex items-center gap-4'>
            <Skeleton className='size-10 shrink-0 rounded-md' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-2/3' />
              <Skeleton className='h-3 w-5/6' />
            </div>
            <Skeleton className='hidden h-6 w-20 rounded-full sm:block' />
          </div>
        ))}
      </section>
    </RouteSkeletonShell>
  );
}

export function GridRouteSkeleton({ label = 'Loading' }: { label?: string }) {
  return (
    <RouteSkeletonShell label={label}>
      <Skeleton className='h-10 w-full max-w-md' />
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className='border-border/70 bg-card space-y-3 rounded-md border p-4'>
            <Skeleton className='h-36 w-full rounded-md' />
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-3 w-1/2' />
          </div>
        ))}
      </div>
    </RouteSkeletonShell>
  );
}

export function DetailRouteSkeleton({ label = 'Loading details' }: { label?: string }) {
  return (
    <RouteSkeletonShell label={label}>
      <Skeleton className='h-28 w-full rounded-md' />
      <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]'>
        <div className='space-y-4'>
          <SectionCardSkeleton rows={5} />
          <SectionCardSkeleton rows={4} />
        </div>
        <SectionCardSkeleton rows={6} />
      </div>
    </RouteSkeletonShell>
  );
}

export function FormRouteSkeleton({ label = 'Loading form' }: { label?: string }) {
  return (
    <RouteSkeletonShell label={label}>
      <section className='border-border/70 bg-card space-y-5 rounded-md border p-5'>
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className='space-y-2'>
            <Skeleton className='h-3 w-32' />
            <Skeleton className='h-10 w-full' />
          </div>
        ))}
        <div className='flex justify-end'>
          <Skeleton className='h-10 w-28' />
        </div>
      </section>
    </RouteSkeletonShell>
  );
}
