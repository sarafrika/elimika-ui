import { Skeleton } from '@/components/ui/skeleton';

export default function StudentFindClassesLoading() {
  return (
    <div className='space-y-6 px-4 py-6 sm:px-5 lg:px-6'>
      <Skeleton className='h-20 w-full rounded-xl' />
      <Skeleton className='h-40 w-full rounded-xl' />
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className='h-36 w-full rounded-xl' />
      ))}
    </div>
  );
}
