import { Suspense } from 'react';
import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { RevenuePage } from '@/src/features/admin/pages/revenue-page';

export default function AdminRevenueRoute() {
  return (
    <Suspense
      fallback={
        <div className={surfaceTheme.page}>
          <div className={surfaceTheme.pageStack}>
            <SectionCardSkeleton rows={2} />
            <SectionCardSkeleton rows={5} />
          </div>
        </div>
      }
    >
      <RevenuePage />
    </Suspense>
  );
}
