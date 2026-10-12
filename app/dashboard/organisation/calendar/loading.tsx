import { Skeleton } from '@/components/ui/skeleton';

/** Shaped like the scheduler: navigation toolbar, then the week grid beside a rail. */
export default function CalendarLoading() {
  return (
    <main className='bg-background space-y-4 px-4 pt-4 pb-8' aria-busy='true'>
      <div className='flex w-full flex-wrap justify-between gap-4'>
        <div className='flex gap-2'>
          <Skeleton className='h-10 w-20' />
          <Skeleton className='h-10 w-10' />
          <Skeleton className='h-10 w-10' />
          <Skeleton className='h-10 w-44' />
        </div>
        <div className='flex gap-2'>
          <Skeleton className='h-10 w-56' />
          <Skeleton className='h-10 w-32' />
        </div>
      </div>
      <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]'>
        <Skeleton className='h-[640px] w-full rounded-md' />
        <div className='hidden space-y-4 xl:block'>
          <Skeleton className='h-48 w-full rounded-md' />
          <Skeleton className='h-72 w-full rounded-md' />
        </div>
      </div>
    </main>
  );
}
