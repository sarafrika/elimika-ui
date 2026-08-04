import { Skeleton } from '@/components/ui/skeleton';

/** Shape-matching skeleton shared by `loading.tsx` and the page's Suspense fallback. */
export function GroupsPageSkeleton() {
  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <div className='space-y-2 border-b pb-4'>
        <Skeleton className='h-8 w-56' />
        <Skeleton className='h-4 w-96 max-w-full' />
      </div>
      <div className='flex gap-2 overflow-hidden'>
        {[...Array(7)].map((_, index) => (
          <Skeleton key={index} className='h-9 w-28 shrink-0 rounded-full' />
        ))}
      </div>
      <Skeleton className='h-6 w-72' />
      <div className='rounded-lg border p-4'>
        <RosterSkeleton />
      </div>
    </div>
  );
}

/** Rows-only skeleton for the table card while a roster page is in flight. */
export function RosterSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-9 w-full' />
      {[...Array(rows)].map((_, index) => (
        <Skeleton key={index} className='h-12 w-full' />
      ))}
    </div>
  );
}
