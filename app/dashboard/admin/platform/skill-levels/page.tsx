import { Suspense } from 'react';
import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { SkillLevelsPage } from '@/src/features/admin/pages/skill-levels-page';

export default function AdminSkillLevelsRoute() {
  return (
    <Suspense
      fallback={
        <div className={`${surfaceTheme.pageWide} py-4`}>
          <div className={surfaceTheme.pageStack}>
            <SectionCardSkeleton rows={4} />
          </div>
        </div>
      }
    >
      <SkillLevelsPage />
    </Suspense>
  );
}
