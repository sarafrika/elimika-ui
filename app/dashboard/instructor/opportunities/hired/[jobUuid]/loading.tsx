import { HiredJobDetailsSkeleton } from '@/components/profile-job-marketplace/_components/HiredJobDetailsPage';
import { surfaceTheme } from '@/components/data-display';

export default function HiredJobLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <HiredJobDetailsSkeleton />
      </div>
    </div>
  );
}
