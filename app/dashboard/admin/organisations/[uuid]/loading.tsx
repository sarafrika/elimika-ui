import { SectionCardSkeleton, StatCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminOrganisationLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='flex items-start gap-4'>
          <Skeleton className='size-14 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-7 w-64' />
            <Skeleton className='h-4 w-96 max-w-full' />
          </div>
        </div>
        <Skeleton className='h-11 w-full' />
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {[0, 1, 2, 3].map(item => (
            <StatCardSkeleton key={item} />
          ))}
        </div>
        <SectionCardSkeleton rows={4} />
      </div>
    </div>
  );
}
