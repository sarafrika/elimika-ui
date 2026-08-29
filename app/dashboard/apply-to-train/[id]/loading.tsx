import { Skeleton } from '@/components/ui/skeleton';

export default function ApplyToTrainLoading() {
  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <Skeleton className='h-16 w-full' />
      <Skeleton className='h-12 w-3/4' />
      <Skeleton className='h-96 w-full' />
    </div>
  );
}
