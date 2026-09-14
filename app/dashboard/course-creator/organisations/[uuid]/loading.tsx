import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className='mx-auto w-full max-w-[2200px] space-y-6 px-3 py-4 sm:px-5 lg:px-6'>
      <Skeleton className='h-9 w-48' />
      <Skeleton className='h-24 w-full' />
      <Skeleton className='h-48 w-full' />
      <Skeleton className='h-72 w-full' />
    </main>
  );
}
