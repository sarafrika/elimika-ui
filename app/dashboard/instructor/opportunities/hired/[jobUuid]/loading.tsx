import { HiredJobDetailsSkeleton } from '@/components/profile-job-marketplace/_components/HiredJobDetailsPage';
import { surfaceTheme } from '@/components/data-display';

export default function HiredJobLoading() {
  return (
    <div className={`${surfaceTheme.pageWide} py-4`}>
      <div className={surfaceTheme.pageStack}>
        <HiredJobDetailsSkeleton />
      </div>
    </div>
  );
}
