import { Skeleton } from '@/components/ui/skeleton';

export default function InstructorEnrollmentsLoading() {
  return (
    <div className='flex w-full flex-col gap-4 p-4 sm:p-6'>
      <Skeleton className='h-8 w-48' />
      <Skeleton className='h-4 w-80 max-w-full' />
      <div className='flex gap-2 overflow-hidden'>
        {[0, 1, 2, 3, 4].map(index => (
          <Skeleton key={index} className='h-9 w-32 shrink-0 rounded-full' />
        ))}
      </div>
      <Skeleton className='h-96 w-full rounded-xl' />
    </div>
  );
}
