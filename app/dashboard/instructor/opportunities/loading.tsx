import { adminTheme, StatCardSkeleton } from '@/app/dashboard/admin/_components/ui';
import { Skeleton } from '@/components/ui/skeleton';

/** Shared by the Jobs tabs that have no loading state of their own. */
export default function JobsLoading() {
  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <div className='space-y-2 border-b pb-4'>
          <Skeleton className='h-8 w-32' />
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <Skeleton className='h-11 w-80 max-w-full' />
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {[0, 1, 2, 3].map(item => (
            <StatCardSkeleton key={item} />
          ))}
        </div>
        <div className='flex flex-col gap-4'>
          <Skeleton className='h-28 rounded-md' />
          <Skeleton className='h-56 rounded-md' />
          <Skeleton className='h-56 rounded-md' />
        </div>
      </div>
    </div>
  );
}
