import { adminTheme } from '@/app/dashboard/admin/_components/ui';
import { ApplicationDetailSkeleton } from '@/src/features/instructor-jobs/applications/components/application-detail-page';

export default function InstructorApplicationLoading() {
  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <ApplicationDetailSkeleton />
      </div>
    </div>
  );
}
