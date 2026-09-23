import { Suspense } from 'react';
import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { AdminOrganisationPage } from '@/src/features/admin/pages/organisation-page';

export default async function AdminOrganisationRoute({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;

  return (
    <Suspense
      fallback={
        <div className={surfaceTheme.page}>
          <div className={surfaceTheme.pageStack}>
            <SectionCardSkeleton rows={2} />
            <SectionCardSkeleton rows={4} />
          </div>
        </div>
      }
    >
      <AdminOrganisationPage uuid={uuid} />
    </Suspense>
  );
}
