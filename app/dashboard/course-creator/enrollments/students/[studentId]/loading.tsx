import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-28 w-full rounded-md' />
      <Skeleton className='h-[420px] w-full rounded-md' />
      <Skeleton className='h-[220px] w-full rounded-md' />
    </div>
  );
}
