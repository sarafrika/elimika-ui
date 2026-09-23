import { Suspense } from 'react';
import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { AdminPersonPage } from '@/src/features/admin/pages/person-page';

export default async function AdminPersonRoute({
  params,
}: {
  params: Promise<{ userUuid: string }>;
}) {
  const { userUuid } = await params;

  return (
    <Suspense fallback={<PersonFallback />}>
      <AdminPersonPage userUuid={userUuid} />
    </Suspense>
  );
}

function PersonFallback() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <SectionCardSkeleton rows={2} />
        <SectionCardSkeleton rows={6} />
      </div>
    </div>
  );
}
