import { Skeleton } from '@/components/ui/skeleton';

export default function StartCourseLoading() {
  return (
    <div className='space-y-4 p-4 sm:p-6'>
      <Skeleton className='h-8 w-56' />
      <Skeleton className='h-4 w-80 max-w-full' />
      <Skeleton className='h-72 w-full rounded-xl' />
    </div>
  );
}
