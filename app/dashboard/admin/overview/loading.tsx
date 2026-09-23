import {
  SectionCardSkeleton,
  StatCardSkeleton,
  surfaceTheme,
} from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

/** Shaped like Home: header, decision band, four counts, activity beside health. */
export default function AdminOverviewLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-3 w-28' />
          <Skeleton className='h-8 w-56' />
          <Skeleton className='h-4 w-72' />
        </div>

        <SectionCardSkeleton rows={3} />

        <div className='grid gap-4 lg:grid-cols-4'>
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        <div className='grid gap-4 lg:grid-cols-3'>
          <div className='lg:col-span-2'>
            <SectionCardSkeleton rows={6} />
          </div>
          <SectionCardSkeleton rows={4} />
        </div>
      </div>
    </div>
  );
}
