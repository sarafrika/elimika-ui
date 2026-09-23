import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCoursesLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-3 w-20' />
          <Skeleton className='h-8 w-48' />
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-16 w-full' />
        </div>
        <div className='flex gap-4'>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className='h-6 w-24' />
          ))}
        </div>
        <Skeleton className='h-9 w-full max-w-xl' />
        <SectionCardSkeleton rows={8} withHeader={false} />
      </div>
    </div>
  );
}
