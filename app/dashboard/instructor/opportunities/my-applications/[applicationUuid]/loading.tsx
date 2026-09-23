import { ApplicationDetailSkeleton } from '@/src/features/instructor-jobs/applications/components/application-detail-page';
import { surfaceTheme } from '@/components/data-display';

export default function InstructorApplicationLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <ApplicationDetailSkeleton />
      </div>
    </div>
  );
}
