import { Skeleton } from '@/components/ui/skeleton';

export default function InstructorApplyToTrainLoading() {
  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-5 px-3 py-4 sm:px-5 lg:px-6'>
      <div className='space-y-2 border-b pb-4'>
        <Skeleton className='h-4 w-28' />
        <Skeleton className='h-8 w-56' />
        <Skeleton className='h-4 w-[32rem] max-w-full' />
      </div>
      <Skeleton className='h-20 w-full rounded-2xl' />
      <Skeleton className='h-14 w-full rounded-2xl' />
      <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]'>
        <Skeleton className='h-96 rounded-2xl' />
        <Skeleton className='h-72 rounded-2xl' />
      </div>
    </div>
  );
}
