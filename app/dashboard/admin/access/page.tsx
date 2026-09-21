import { Suspense } from 'react';
import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { AdminAccessPage } from '@/src/features/admin/pages/access-page';

export default function AdminAccessRoute() {
  return (
    <Suspense
      fallback={
        <div className={surfaceTheme.page}>
          <div className={surfaceTheme.pageStack}>
            <SectionCardSkeleton rows={2} />
            <SectionCardSkeleton rows={6} />
          </div>
        </div>
      }
    >
      <AdminAccessPage />
    </Suspense>
  );
}
