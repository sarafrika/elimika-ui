import { Suspense } from 'react';
import { fetchAdminRubrics, type AdminRubric } from '@/services/admin';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { SectionCardSkeleton } from '../_components/ui/SectionCard';
import { RubricsTable } from './_components/RubricsTable';

async function RubricsSection() {
  const result = await fetchAdminRubrics({ size: 200 }).catch(() => ({ items: [] }));
  const rubrics = (result.items ?? []) as AdminRubric[];
  return <RubricsTable rubrics={rubrics} />;
}

export default function RubricsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Assessment rubrics'
          description='Browse and manage grading rubrics across the platform.'
        />
        <Suspense fallback={<SectionCardSkeleton rows={6} />}>
          <RubricsSection />
        </Suspense>
      </div>
    </main>
  );
}
