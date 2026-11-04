import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPayoutBatchLoading() {
  return (
    <div className={`${surfaceTheme.pageWide} py-4`}>
      <div className={surfaceTheme.pageStack}>
        <Skeleton className='h-4 w-32' />
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-7 w-72 max-w-full' />
        </div>
        <div className='flex flex-wrap gap-5'>
          <Skeleton className='h-40 flex-[1_1_320px]' />
          <Skeleton className='h-40 flex-[1_1_320px]' />
        </div>
        <SectionCardSkeleton rows={6} withHeader={false} />
      </div>
    </div>
  );
}
