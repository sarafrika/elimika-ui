import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-24 w-full rounded-md' />
      <Skeleton className='h-[520px] w-full rounded-md' />
    </div>
  );
}
