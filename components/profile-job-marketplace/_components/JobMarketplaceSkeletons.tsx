import { Skeleton } from '@/components/ui/skeleton';

export function JobListSkeleton() {
  return (
    <div className='grid gap-4 3xl:grid-cols-2'>
      {[0, 1, 2, 3].map(item => (
        <Skeleton key={item} className='h-44 rounded-[22px]' />
      ))}
    </div>
  );
}

export function MarketplaceSidebarSkeleton() {
  return (
    <div className='space-y-4 rounded-[18px] border border-border bg-card p-4'>
      <div className='space-y-2'>
        <Skeleton className='h-5 w-24 rounded-md' />
        <Skeleton className='h-4 w-36 rounded-md' />
      </div>
      {[0, 1].map(group => (
        <div key={group} className='space-y-3 rounded-xl border border-border p-3'>
          <Skeleton className='h-4 w-28 rounded-md' />
          {[0, 1, 2].map(item => (
            <Skeleton key={item} className='h-8 w-full rounded-lg' />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SelectSkeleton() {
  return <Skeleton className='h-11 w-full rounded-md' />;
}
