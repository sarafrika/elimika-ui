import { Skeleton } from '@/components/ui/skeleton';

export default function PostJobLoading() {
  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <div className='space-y-2 border-b pb-4'>
        <Skeleton className='h-8 w-40' />
        <Skeleton className='h-4 w-[36rem] max-w-full' />
      </div>
      <div className='space-y-2'>
        <Skeleton className='h-4 w-44' />
        <Skeleton className='h-9 w-full' />
      </div>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {[0, 1, 2, 3].map(item => (
          <Skeleton key={item} className='h-20 rounded-lg' />
        ))}
      </div>
      <Skeleton className='h-28 w-full rounded-lg' />
      <div className='space-y-4 rounded-lg border p-5'>
        <div className='space-y-2'>
          <Skeleton className='h-5 w-40' />
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Skeleton className='h-9 w-full' />
          <Skeleton className='h-9 w-full' />
        </div>
        <Skeleton className='h-24 w-full' />
      </div>
      <div className='grid gap-3 sm:grid-cols-3'>
        {[0, 1, 2].map(item => (
          <Skeleton key={item} className='h-20 rounded-lg' />
        ))}
      </div>
    </div>
  );
}
