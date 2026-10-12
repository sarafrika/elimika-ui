import {
  HeaderSkeleton,
  OrgLoadingPage,
  StatRowSkeleton,
  TabsSkeleton,
} from '@/app/dashboard/organisation/_components/org-loading';
import { Skeleton } from '@/components/ui/skeleton';

/** Shaped like the notification centre: counts, tabs, then a list of message rows. */
export default function NotificationsLoading() {
  return (
    <OrgLoadingPage>
      <HeaderSkeleton />
      <StatRowSkeleton count={3} />
      <TabsSkeleton count={3} />
      <div className='bg-card space-y-3 rounded-xl border p-4'>
        {[0, 1, 2, 3, 4, 5].map(row => (
          <div key={row} className='flex items-start gap-3'>
            <Skeleton className='size-9 shrink-0 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-2/3' />
              <Skeleton className='h-3 w-1/3' />
            </div>
          </div>
        ))}
      </div>
    </OrgLoadingPage>
  );
}
