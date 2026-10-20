import { ClassWorkbookRoute } from '@/components/lesson/ClassWorkbookRoute';
import { WorkbookLoading } from '@/components/lesson/WorkbookLoading';
import { Suspense } from 'react';

export default async function ClassWorkbookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<WorkbookLoading />}>
      <ClassWorkbookRoute classId={id} role='student' />
    </Suspense>
  );
}

// ft: improve enrollments, assessment previews and scheduler filters

// - Show class enrollment counts, course filters and training rates
// - Add quiz and assignment previews to program evaluations
// - Add scheduler event-type toggles and remove the KPI strip
// - Open the Grading tab from attendance evaluation actions
