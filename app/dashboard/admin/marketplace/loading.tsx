import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminMarketplaceLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-7 w-44' />
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <Skeleton className='h-9 w-48' />
        <SectionCardSkeleton rows={6} withHeader={false} />
      </div>
    </div>
  );
}
