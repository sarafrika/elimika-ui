import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCurrenciesLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-7 w-44' />
          <Skeleton className='h-4 w-80 max-w-full' />
        </div>
        <SectionCardSkeleton rows={6} withHeader={false} />
      </div>
    </div>
  );
}
