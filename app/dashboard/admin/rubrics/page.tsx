import { Suspense } from 'react';
import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { RubricsPage } from '@/src/features/admin/pages/rubrics-page';

export default function AdminRubricsRoute() {
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
      <RubricsPage />
    </Suspense>
  );
}
