import { SectionCardSkeleton, StatCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminRevenueLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-7 w-40' />
          <Skeleton className='h-4 w-80 max-w-full' />
        </div>
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {[0, 1, 2, 3].map(item => (
            <StatCardSkeleton key={item} />
          ))}
        </div>
        <div className='grid gap-4 lg:grid-cols-3'>
          <SectionCardSkeleton rows={5} className='lg:col-span-2' />
          <SectionCardSkeleton rows={4} />
        </div>
      </div>
    </div>
  );
}
