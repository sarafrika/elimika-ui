import { adminTheme } from '@/app/dashboard/admin/_components/ui';
import { HiredJobDetailsSkeleton } from '@/components/profile-job-marketplace/_components/HiredJobDetailsPage';

export default function HiredJobLoading() {
  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <HiredJobDetailsSkeleton />
      </div>
    </div>
  );
}
