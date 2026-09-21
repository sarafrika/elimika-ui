import { Suspense } from 'react';
import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { RulesPage } from '@/src/features/admin/pages/rules-page';

export default function AdminRulesRoute() {
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
      <RulesPage />
    </Suspense>
  );
}
