import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminInboxLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-3 w-24' />
          <Skeleton className='h-8 w-72' />
        </div>
        <div className='grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_380px]'>
          <SectionCardSkeleton rows={7} withHeader={false} />
          <SectionCardSkeleton rows={6} withHeader={false} />
          <SectionCardSkeleton rows={4} withHeader={false} />
        </div>
      </div>
    </div>
  );
}
