import { Skeleton } from '@/components/ui/skeleton';

export default function JobsLoading() {
  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-3 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <div className='flex items-end justify-between gap-4 border-b pb-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-4 w-[34rem] max-w-full' />
        </div>
        <Skeleton className='h-9 w-32' />
      </div>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {[0, 1, 2, 3].map(item => (
          <Skeleton key={item} className='h-24 rounded-xl' />
        ))}
      </div>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Skeleton className='h-9 w-[28rem] max-w-full' />
        <Skeleton className='h-9 w-72 max-w-full' />
      </div>
      <div className='space-y-2 rounded-md border p-3'>
        {[0, 1, 2, 3, 4].map(item => (
          <Skeleton key={item} className='h-16 w-full' />
        ))}
      </div>
    </div>
  );
}
