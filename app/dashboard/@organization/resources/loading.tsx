import { Skeleton } from '@/components/ui/skeleton';

export default function ResourcesLoading() {
  return (
    <main className='mx-auto w-full max-w-[1520px] space-y-6 px-4 py-6 sm:px-6'>
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-44' />
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <Skeleton className='h-9 w-36' />
      </div>
      <div className='flex gap-2'>
        <Skeleton className='h-8 w-16' />
        <Skeleton className='h-8 w-20' />
        <Skeleton className='h-8 w-24' />
      </div>
      <div className='space-y-3'>
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-12 w-full' />
      </div>
    </main>
  );
}
