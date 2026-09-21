import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminConfigLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-7 w-56' />
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <Skeleton className='h-20 w-full rounded-md' />
        <Skeleton className='h-11 w-full' />
        <SectionCardSkeleton rows={6} />
      </div>
    </div>
  );
}
