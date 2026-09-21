import { Suspense } from 'react';
import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { AdminProgramPage } from '@/src/features/admin/pages/program-page';

export default async function AdminProgramRoute({
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
      <AdminProgramPage uuid={uuid} />
    </Suspense>
  );
}
