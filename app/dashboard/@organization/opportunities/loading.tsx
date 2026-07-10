import { Skeleton } from '@/components/ui/skeleton';

export default function OrganizationClassJobsLoading() {
  return (
    <main className='mx-auto w-full max-w-[1520px] px-3 py-4 sm:px-5 lg:px-7'>
      <div className='flex w-full flex-col gap-4'>
        <div className='rounded-md border border-border/70 bg-card px-5 py-5 shadow-sm'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='space-y-2'>
              <Skeleton className='h-8 w-56 rounded-md' />
              <Skeleton className='h-4 w-80 max-w-full rounded-md' />
            </div>
            <Skeleton className='h-10 w-32 rounded-md' />
          </div>
        </div>

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {[0, 1, 2, 3].map(item => (
            <Skeleton key={item} className='h-24 rounded-md' />
          ))}
        </div>

        <div className='grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]'>
          <Skeleton className='hidden h-[420px] rounded-md xl:block' />
          <div className='space-y-4'>
            <Skeleton className='h-40 w-full rounded-md' />
            {[0, 1, 2, 3].map(item => (
              <Skeleton key={item} className='h-44 rounded-md' />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
