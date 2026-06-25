import { Skeleton } from '@/components/ui/skeleton';

export default function OrganizationClassJobsLoading() {
  return (
    <main className='min-h-screen px-3 py-4 sm:px-5 lg:px-7'>
      <div className='mx-auto grid max-w-[1560px] gap-4 xl:grid-cols-[270px_minmax(0,1fr)]'>
        <Skeleton className='hidden h-[520px] rounded-[18px] xl:block' />
        <div className='space-y-4 rounded-[18px] border border-border p-5'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='space-y-2'>
              <Skeleton className='h-8 w-56 rounded-md' />
              <Skeleton className='h-4 w-80 max-w-full rounded-md' />
            </div>
            <Skeleton className='h-10 w-32 rounded-xl' />
          </div>
          <Skeleton className='h-10 w-full rounded-md' />
          <div className='grid gap-3 md:grid-cols-3'>
            {[0, 1, 2].map(item => (
              <Skeleton key={item} className='h-11 rounded-md' />
            ))}
          </div>
          {[0, 1, 2, 3].map(item => (
            <Skeleton key={item} className='h-44 rounded-[22px]' />
          ))}
        </div>
      </div>
    </main>
  );
}
