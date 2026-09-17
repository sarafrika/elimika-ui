import { Skeleton } from '@/components/ui/skeleton';
import { ApplicationsListSkeleton } from '@/src/features/instructor-jobs/applications/components/applications-list';
import { surfaceTheme } from '@/components/data-display';

export default function InstructorApplicationsLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2 border-b pb-4'>
          <Skeleton className='h-8 w-32' />
          <Skeleton className='h-4 w-full max-w-xl' />
        </div>
        <Skeleton className='h-11 w-full max-w-md' />
        <Skeleton className='h-9 w-56' />
        <div className={surfaceTheme.card}>
          <ApplicationsListSkeleton />
        </div>
      </div>
    </div>
  );
}
