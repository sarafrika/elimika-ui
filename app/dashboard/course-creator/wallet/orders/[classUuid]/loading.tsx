import { Skeleton } from '@/components/ui/skeleton';

export default function ClassOrderLoading() {
  return (
    <div className='space-y-4 p-4' role='status' aria-label='Loading class order'>
      <Skeleton className='h-24' />
      <Skeleton className='h-80' />
    </div>
  );
}
