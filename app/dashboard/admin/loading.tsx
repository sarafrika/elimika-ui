import { SectionCardSkeleton, StatCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

/** Admin index redirects to Overview, so this mirrors the Overview shape. */
export default function AdminLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-3 w-28' />
          <Skeleton className='h-8 w-56' />
          <Skeleton className='h-4 w-72 max-w-full' />
        </div>
        <SectionCardSkeleton rows={3} />
        <div className='grid gap-4 lg:grid-cols-4'>
          {[0, 1, 2, 3].map(item => (
            <StatCardSkeleton key={item} />
          ))}
        </div>
        <SectionCardSkeleton rows={6} />
      </div>
    </div>
  );
}
