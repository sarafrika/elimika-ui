import { Skeleton } from '@/components/ui/skeleton';

export default function StudentBookingsLoading() {
  return (
    <div className='space-y-6 px-4 py-6 sm:px-5 lg:px-6'>
      <Skeleton className='h-40 w-full rounded-[24px]' />
      <div className='grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='space-y-4'>
          <Skeleton className='h-20 w-full rounded-[24px]' />
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-36 w-full rounded-[20px]' />
          ))}
        </div>
        <div className='space-y-4'>
          <Skeleton className='h-16 w-full rounded-[24px]' />
          <Skeleton className='h-72 w-full rounded-[24px]' />
        </div>
      </div>
    </div>
  );
}
