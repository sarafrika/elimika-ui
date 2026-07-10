import { Skeleton } from '@/components/ui/skeleton';

export function JobListSkeleton() {
  return (
    <div className='grid gap-4 3xl:grid-cols-2'>
      {[0, 1, 2, 3].map(item => (
        <div
          key={item}
          className='flex gap-4 rounded-md border border-border/70 bg-card p-5 shadow-sm'
        >
          <Skeleton className='size-11 shrink-0 rounded-md' />
          <div className='min-w-0 flex-1 space-y-3'>
            <div className='space-y-2'>
              <Skeleton className='h-5 w-2/3 rounded-md' />
              <Skeleton className='h-3.5 w-1/2 rounded-md' />
            </div>
            <div className='flex flex-wrap gap-2'>
              {[0, 1, 2, 3].map(badge => (
                <Skeleton key={badge} className='h-5 w-20 rounded-md' />
              ))}
            </div>
            <Skeleton className='h-3.5 w-full rounded-md' />
            <Skeleton className='h-3.5 w-4/5 rounded-md' />
            <div className='flex gap-2 pt-1'>
              <Skeleton className='h-8 w-16 rounded-md' />
              <Skeleton className='h-8 w-20 rounded-md' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MarketplaceSidebarSkeleton() {
  return (
    <div className='space-y-4 rounded-md border border-border/70 bg-card p-4 shadow-sm'>
      <div className='space-y-2 border-b border-border/60 pb-4'>
        <Skeleton className='h-5 w-24 rounded-md' />
        <Skeleton className='h-4 w-36 rounded-md' />
      </div>
      {[0, 1].map(group => (
        <div key={group} className='space-y-3 border-b border-border/60 pb-4 last:border-b-0'>
          <Skeleton className='h-3.5 w-28 rounded-md' />
          {[0, 1, 2].map(item => (
            <Skeleton key={item} className='h-8 w-full rounded-md' />
          ))}
        </div>
      ))}
      <Skeleton className='h-9 w-full rounded-md' />
      <Skeleton className='h-9 w-full rounded-md' />
    </div>
  );
}

export function SelectSkeleton() {
  return <Skeleton className='h-11 w-full rounded-md' />;
}
