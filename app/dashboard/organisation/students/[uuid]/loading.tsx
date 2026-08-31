import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className='mx-auto w-full max-w-[2200px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[2400px]'>
      <Skeleton className='h-8 w-44 rounded-md' />
      <Skeleton className='h-36 w-full rounded-md' />
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-6'>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className='h-[88px] rounded-md' />
        ))}
      </div>
      <div className='grid gap-4 xl:grid-cols-2'>
        <Skeleton className='h-80 rounded-md' />
        <Skeleton className='h-80 rounded-md' />
      </div>
    </main>
  );
}
