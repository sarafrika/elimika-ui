import { Skeleton } from '@/components/ui/skeleton';

/** Shape-matching placeholder for a training application's details page. */
export function ApplicationDetailsSkeleton() {
  return (
    <div className='space-y-5'>
      <div className='space-y-3'>
        <Skeleton className='h-4 w-28' />
        <Skeleton className='h-5 w-56' />
        <Skeleton className='h-8 w-96 max-w-full' />
        <Skeleton className='h-4 w-72 max-w-full' />
      </div>
      <Skeleton className='h-40 w-full rounded-xl' />
      <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='space-y-5'>
          <Skeleton className='h-72 w-full rounded-xl' />
          <Skeleton className='h-40 w-full rounded-xl' />
        </div>
        <div className='space-y-5'>
          <Skeleton className='h-44 w-full rounded-xl' />
          <Skeleton className='h-56 w-full rounded-xl' />
        </div>
      </div>
    </div>
  );
}
