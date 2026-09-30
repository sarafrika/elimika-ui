import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='space-y-6 p-6' aria-label='Loading skills wallet'>
      <Skeleton className='h-16 w-full' />
      <Skeleton className='h-24 w-full' />
      <Skeleton className='h-64 w-full' />
    </div>
  );
}
