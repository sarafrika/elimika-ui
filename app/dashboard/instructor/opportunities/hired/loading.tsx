import { adminTheme } from '@/app/dashboard/admin/_components/ui';
import { HiredJobListSkeleton } from '@/components/profile-job-marketplace/_components/JobMarketplaceSkeletons';
import { Skeleton } from '@/components/ui/skeleton';

export default function JobHiresLoading() {
  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <Skeleton className='h-28 w-full' />
        <HiredJobListSkeleton />
      </div>
    </div>
  );
}
