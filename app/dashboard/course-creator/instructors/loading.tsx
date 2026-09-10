import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className='mx-auto w-full max-w-[2200px] space-y-6 px-3 py-4 sm:px-5 lg:px-6'>
      <Skeleton className='h-24 w-full' />
      <div className='grid gap-4 sm:grid-cols-2'>
        <Skeleton className='h-24' />
        <Skeleton className='h-24' />
      </div>
      <Skeleton className='h-10 w-full max-w-md' />
      <Skeleton className='h-80 w-full' />
    </main>
  );
}
