import { Skeleton } from '@/components/ui/skeleton';

export default function TrainingHubLoading() {
  return (
    <div className='flex w-full flex-col gap-4 p-4'>
      <Skeleton className='h-10 w-64 rounded-lg' />
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {[0, 1, 2, 3].map(idx => (
          <Skeleton key={idx} className='h-24 w-full rounded-2xl' />
        ))}
      </div>
      <Skeleton className='h-[480px] w-full rounded-2xl' />
    </div>
  );
}
