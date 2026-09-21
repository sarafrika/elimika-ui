import { SectionCardSkeleton, StatCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminRubricsLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-7 w-52' />
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          {[0, 1].map(item => (
            <StatCardSkeleton key={item} />
          ))}
        </div>
        <Skeleton className='h-9 w-full' />
        <SectionCardSkeleton rows={6} withHeader={false} />
      </div>
    </div>
  );
}
