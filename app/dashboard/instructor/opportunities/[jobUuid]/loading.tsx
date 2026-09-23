import { Skeleton } from '@/components/ui/skeleton';
import { JobHeroSkeleton } from '@/src/features/instructor-jobs/job-page/job-hero';
import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';

export default function JobPageLoading() {
  return (
    <div className={`${surfaceTheme.page} flex flex-col gap-5`}>
      <Skeleton className='h-4 w-16' />
      <JobHeroSkeleton />
      <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]'>
        <div className='flex flex-col gap-5'>
          <Skeleton className='h-11 w-96 max-w-full' />
          <SectionCardSkeleton rows={6} />
        </div>
        <SectionCardSkeleton rows={5} />
      </div>
    </div>
  );
}
