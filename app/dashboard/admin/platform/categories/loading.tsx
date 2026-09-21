import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCategoriesLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-7 w-44' />
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <Skeleton className='h-20 w-full rounded-md' />
        <Skeleton className='h-9 w-full' />
        <div className='grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]'>
          <SectionCardSkeleton rows={6} />
          <SectionCardSkeleton rows={4} />
        </div>
      </div>
    </div>
  );
}
