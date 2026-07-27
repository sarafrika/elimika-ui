import { Skeleton } from '@/components/ui/skeleton';

export default function ResourceDetailLoading() {
  return (
    <main className='mx-auto w-full max-w-[1520px] space-y-6 px-4 py-6 sm:px-6'>
      <Skeleton className='h-4 w-28' />
      <div className='flex items-center gap-4'>
        <Skeleton className='h-12 w-12 rounded-xl' />
        <div className='space-y-2'>
          <Skeleton className='h-7 w-64' />
          <Skeleton className='h-4 w-44' />
        </div>
      </div>
      <Skeleton className='h-9 w-72' />
      <div className='grid grid-cols-2 gap-2 sm:grid-cols-7'>
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className='h-56 w-full' />
        ))}
      </div>
    </main>
  );
}
