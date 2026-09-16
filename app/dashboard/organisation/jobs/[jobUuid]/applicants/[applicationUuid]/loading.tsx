import { Skeleton } from '@/components/ui/skeleton';

export default function JobApplicantLoading() {
  return (
    <div className='mx-auto w-full max-w-[1520px] space-y-4 px-3 py-4 sm:px-5 lg:px-7'>
      <Skeleton className='h-4 w-32' />
      <div className='space-y-2'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-4 w-96 max-w-full' />
      </div>
      <Skeleton className='h-28 w-full rounded-md' />
      <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]'>
        <Skeleton className='h-96 rounded-md' />
        <Skeleton className='h-72 rounded-md' />
      </div>
    </div>
  );
}
