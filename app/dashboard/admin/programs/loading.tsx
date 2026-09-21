import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminProgramsLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-7 w-44' />
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <Skeleton className='h-16 w-full rounded-md' />
        <Skeleton className='h-9 w-full' />
        <SectionCardSkeleton rows={6} withHeader={false} />
      </div>
    </div>
  );
}
