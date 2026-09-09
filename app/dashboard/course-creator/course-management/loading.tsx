import { Skeleton } from '@/components/ui/skeleton';

export default function CoursesLoading() {
  return (
    <div className='space-y-5 p-5' role='status' aria-label='Loading courses and programs'>
      <span className='sr-only'>Loading courses and programs…</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className='flex items-center gap-4'>
          <Skeleton className='h-12 w-16 shrink-0 rounded-lg' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-2/3' />
            <Skeleton className='h-3 w-5/6' />
          </div>
          <Skeleton className='hidden h-6 w-20 rounded-full sm:block' />
          <Skeleton className='hidden h-4 w-24 lg:block' />
        </div>
      ))}
    </div>
  );
}
