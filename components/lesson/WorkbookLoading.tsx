import { Skeleton } from '@/components/ui/skeleton';

export function WorkbookLoading() {
  return (
    <div className='space-y-6 p-6' role='status' aria-label='Loading class lessons'>
      <Skeleton className='h-10 w-2/3' />
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-96 w-full' />
    </div>
  );
}
