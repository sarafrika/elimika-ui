import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='mx-auto w-full max-w-3xl space-y-6 px-4 py-16'>
      <Skeleton className='mx-auto size-16 rounded-full' />
      <Skeleton className='mx-auto h-8 w-64' />
      <Skeleton className='h-64 w-full' />
    </div>
  );
}
