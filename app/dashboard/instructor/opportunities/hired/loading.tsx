import { adminTheme, SectionCardSkeleton } from '@/app/dashboard/admin/_components/ui';
import { HiredJobCardSkeleton } from '@/components/profile-job-marketplace/_components/HiredJobCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function JobHiresLoading() {
  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <div className='space-y-2 border-b pb-4'>
          <Skeleton className='h-8 w-32' />
          <Skeleton className='h-4 w-full max-w-xl' />
        </div>
        <Skeleton className='h-11 w-full max-w-md' />
        <SectionCardSkeleton rows={4} />
        <div className='grid gap-4 lg:grid-cols-2'>
          <HiredJobCardSkeleton />
          <HiredJobCardSkeleton />
        </div>
      </div>
    </div>
  );
}
