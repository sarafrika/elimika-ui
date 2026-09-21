import { Suspense } from 'react';
import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { ClassesPage } from '@/src/features/admin/pages/classes-page';

export default function AdminClassesRoute() {
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
      <ClassesPage />
    </Suspense>
  );
}
