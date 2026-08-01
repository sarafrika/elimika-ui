import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='space-y-4 px-3 py-4 sm:px-4 lg:px-6'>
      <div className='flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-none sm:p-5'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-56' />
          <Skeleton className='h-4 w-80 max-w-full' />
        </div>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <Skeleton className='h-10 w-full rounded-xl sm:max-w-[760px]' />
          <div className='flex gap-2'>
            <Skeleton className='h-10 w-28 rounded-xl' />
            <Skeleton className='h-10 w-32 rounded-xl' />
          </div>
        </div>
      </div>

      <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]'>
        <div className='space-y-4'>
          <Skeleton className='h-[340px] w-full rounded-xl' />
          <Skeleton className='h-20 w-full rounded-xl' />
          <div className='grid gap-4 md:grid-cols-2 2xl:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className='h-[260px] w-full rounded-xl' />
            ))}
          </div>
        </div>
        <div className='space-y-4'>
          <Skeleton className='h-[170px] w-full rounded-xl' />
          <Skeleton className='h-[130px] w-full rounded-xl' />
          <Skeleton className='h-[140px] w-full rounded-xl' />
          <Skeleton className='h-[220px] w-full rounded-xl' />
        </div>
      </div>
    </div>
  );
}
