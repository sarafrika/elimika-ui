import { Suspense } from 'react';
import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { MarketplacePage } from '@/src/features/admin/pages/marketplace-page';

export default function AdminMarketplaceRoute() {
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
      <MarketplacePage />
    </Suspense>
  );
}
