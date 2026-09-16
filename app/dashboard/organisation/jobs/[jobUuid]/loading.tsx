import { Skeleton } from '@/components/ui/skeleton';

export default function JobDetailsLoading() {
  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-5 px-3 py-3 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <Skeleton className='h-4 w-20' />
      <div className='space-y-2 border-b pb-4'>
        <Skeleton className='h-5 w-64' />
        <Skeleton className='h-8 w-[30rem] max-w-full' />
        <Skeleton className='h-4 w-56' />
      </div>
      <Skeleton className='h-16 w-full rounded-md' />
      <Skeleton className='h-9 w-96 max-w-full' />
      <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='space-y-5'>
          <Skeleton className='h-72 rounded-md' />
          <Skeleton className='h-80 rounded-md' />
        </div>
        <div className='space-y-5'>
          <Skeleton className='h-44 rounded-md' />
          <Skeleton className='h-52 rounded-md' />
        </div>
      </div>
    </div>
  );
}
