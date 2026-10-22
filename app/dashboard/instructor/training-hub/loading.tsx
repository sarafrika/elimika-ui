import { Skeleton } from '@/components/ui/skeleton';

export default function TrainingHubLoading() {
  return (
    <div className='flex w-full flex-col gap-4 p-4'>
      <Skeleton className='h-8 w-48 rounded-lg' />
      <Skeleton className='h-4 w-80 max-w-full rounded-lg' />
      <div className='flex gap-2 overflow-hidden'>
        {[0, 1, 2, 3, 4, 5].map(idx => (
          <Skeleton key={idx} className='h-9 w-32 shrink-0 rounded-full' />
        ))}
      </div>
      <Skeleton className='h-[480px] w-full rounded-2xl' />
    </div>
  );
}
