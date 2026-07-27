import { Skeleton } from '@/components/ui/skeleton';

export default function OrganizationClassJobApplicationsLoading() {
  return (
    <div className='mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 sm:p-6'>
      <Skeleton className='h-9 w-48 rounded-lg' />
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-64 rounded-md' />
          <Skeleton className='h-4 w-96 max-w-full rounded-md' />
        </div>
        <Skeleton className='h-8 w-80 max-w-full rounded-md' />
      </div>
      <Skeleton className='h-12 w-full rounded-xl' />
      <div className='grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]'>
        <div className='space-y-3'>
          {[0, 1, 2].map(item => (
            <Skeleton key={item} className='h-56 rounded-2xl' />
          ))}
        </div>
        <Skeleton className='h-80 rounded-[18px]' />
      </div>
    </div>
  );
}
