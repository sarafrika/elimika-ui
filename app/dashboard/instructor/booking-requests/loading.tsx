import { Skeleton } from '@/components/ui/skeleton';

export default function InstructorBookingRequestsLoading() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-56 w-full rounded-[28px]' />
      <div className='grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='space-y-4'>
          <Skeleton className='h-28 w-full rounded-[28px]' />
          <Skeleton className='h-16 w-full rounded-[24px]' />
          <div className='space-y-3'>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className='h-32 w-full rounded-[24px]' />
            ))}
          </div>
          <div className='flex items-center justify-between gap-3'>
            <Skeleton className='h-10 w-28 rounded-xl' />
            <Skeleton className='h-10 w-28 rounded-xl' />
          </div>
        </div>
        <div className='space-y-4'>
          <Skeleton className='h-20 w-full rounded-[28px]' />
          <Skeleton className='h-[34rem] w-full rounded-[28px]' />
        </div>
      </div>
    </div>
  );
}
