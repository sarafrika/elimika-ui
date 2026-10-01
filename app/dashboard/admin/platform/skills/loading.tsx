import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSkillsLoading() {
  return (
    <div className={`${surfaceTheme.pageWide} py-4`}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-7 w-44' />
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <Skeleton className='h-9 w-full' />
        <SectionCardSkeleton rows={8} />
      </div>
    </div>
  );
}
