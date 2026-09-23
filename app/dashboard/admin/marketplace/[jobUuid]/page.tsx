import { Suspense } from 'react';
import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { AdminJobPage } from '@/src/features/admin/pages/job-page';

export default async function AdminJobRoute({
  params,
}: {
  params: Promise<{ jobUuid: string }>;
}) {
  const { jobUuid } = await params;

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
      <AdminJobPage jobUuid={jobUuid} />
    </Suspense>
  );
}
