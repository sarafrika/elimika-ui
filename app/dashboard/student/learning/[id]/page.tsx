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

// - Show class enrollment counts, course filters and training rates
// - Add quiz and assignment previews to program evaluations
// - Add scheduler event-type toggles and remove the KPI strip
// - Open the Grading tab from attendance evaluation actions
// - Replace legacy training routes and update navigation links
// - Redirect old URLs while preserving lesson and session context
// - Move certificate awarding under the new training route
// - Extract shared rubric grading and rich-text preview components
// - Filter grading to the evaluated student with a show-all option
// - Update routing tests and simplify program evaluation copy
