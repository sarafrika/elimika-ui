import { Skeleton } from '@/components/ui/skeleton';

export default function PostJobLoading() {
  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-5 px-3 py-3 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <div className='space-y-2 border-b pb-4'>
        <Skeleton className='h-8 w-40' />
        <Skeleton className='h-4 w-[32rem] max-w-full' />
      </div>
      <div className='grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]'>
        <div className='flex gap-1 rounded-md border p-2 lg:flex-col'>
          {[0, 1, 2, 3, 4, 5].map(item => (
            <div key={item} className='flex min-w-40 items-start gap-2.5 p-2.5 lg:min-w-0'>
              <Skeleton className='size-6 shrink-0 rounded-full' />
              <div className='flex-1 space-y-1.5'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-3 w-20' />
              </div>
            </div>
          ))}
        </div>
        <div className='rounded-md border'>
          <div className='space-y-2 border-b px-5 py-4'>
            <Skeleton className='h-3 w-20' />
            <Skeleton className='h-6 w-56' />
            <Skeleton className='h-4 w-96 max-w-full' />
          </div>
          <div className='space-y-6 p-5'>
            <div className='space-y-2'>
              <Skeleton className='h-4 w-48' />
              <Skeleton className='h-9 w-full' />
            </div>
            <div className='grid gap-3 sm:grid-cols-3'>
              {[0, 1, 2].map(item => (
                <Skeleton key={item} className='h-20 rounded-lg' />
              ))}
            </div>
          </div>
          <div className='flex justify-between border-t px-5 py-4'>
            <Skeleton className='h-9 w-24' />
            <Skeleton className='h-9 w-28' />
          </div>
        </div>
      </div>
    </div>
  );
}
