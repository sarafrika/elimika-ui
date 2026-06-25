import { Suspense } from 'react';
import { getAllTrainingPrograms } from '@/services/client';
import type { TrainingProgram } from '@/services/client';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { SectionCardSkeleton } from '../_components/ui/SectionCard';
import { ProgramsTable } from './_components/ProgramsTable';

async function ProgramsSection() {
  const { data } = await getAllTrainingPrograms({
    query: { pageable: { page: 0, size: 200, sort: ['updated_date,desc'] } },
  }).catch(() => ({ data: undefined }));
  const programs = (data?.data?.content ?? []) as TrainingProgram[];
  return <ProgramsTable programs={programs} />;
}

export default function ManageProgramsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Manage programs'
          description='Browse all training programs and review their publication status.'
        />
        <Suspense fallback={<SectionCardSkeleton rows={6} />}>
          <ProgramsSection />
        </Suspense>
      </div>
    </main>
  );
}
